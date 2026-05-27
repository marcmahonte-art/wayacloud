import { NextResponse } from "next/server";
import { verifyCinetPaySignature } from "@/lib/cinetpay";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-cinetpay-signature") ?? "";

  if (!verifyCinetPaySignature(payload, signature)) {
    return NextResponse.json(
      { message: "Signature de paiement invalide." },
      { status: 401 },
    );
  }

  const data = JSON.parse(payload);
  const transactionId = data.transaction_id;
  const status = data.status;
  const amount = parseInt(data.amount, 10);

  if (status !== "00" && status !== "success") {
    return NextResponse.json({ message: "Paiement non confirmé." });
  }

  const supabase = createAdminSupabaseClient();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, user_id, is_gift, gift_recipient_phone, gift_message, promo_code_id, amount_fcfa, plan_id")
    .eq("cinetpay_transaction_id", transactionId)
    .single();

  if (paymentError || !payment) {
    const { error: insertError } = await supabase.from("payments").insert({
      cinetpay_transaction_id: transactionId,
      amount_fcfa: amount,
      status: "paid",
      provider_payload: { raw: data },
    });
    if (insertError) {
      console.error("Failed to record payment:", insertError);
    }
    return NextResponse.json({ message: "Paiement enregistré." });
  }

  await supabase
    .from("payments")
    .update({ status: "paid", provider_payload: { raw: data } })
    .eq("id", payment.id);

  if (payment.plan_id && !payment.is_gift) {
    const { data: plan } = await supabase
      .from("storage_plans")
      .select("id, name, storage_go, monthly_price_fcfa")
      .eq("id", payment.plan_id)
      .single();

    if (plan && plan.monthly_price_fcfa > 0) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, ends_at")
        .eq("user_id", payment.user_id)
        .eq("is_active", true)
        .maybeSingle();

      const storageBytes = plan.storage_go * 1073741824;

      await supabase
        .from("storage_quotas")
        .update({ storage_limit_bytes: storageBytes })
        .eq("user_id", payment.user_id);

      if (existingSub) {
        const currentEnd = existingSub.ends_at
          ? new Date(existingSub.ends_at).getTime()
          : Date.now();
        await supabase
          .from("subscriptions")
          .update({
            plan_id: plan.id,
            ends_at: new Date(currentEnd + 30 * 86400000).toISOString(),
            is_active: true,
            is_trial: false,
            trial_ends_at: null,
          })
          .eq("id", existingSub.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            user_id: payment.user_id,
            plan_id: plan.id,
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            is_active: true,
            is_trial: false,
          });
      }

      await supabase.rpc("insert_activity", {
        p_user_id: payment.user_id,
        p_type: "payment",
        p_title: `Paiement ${plan.name} reçu`,
        p_description: `${plan.name} · ${(payment.amount_fcfa ?? amount).toLocaleString("fr-FR")} FCFA`,
        p_metadata: JSON.stringify({
          plan_name: plan.name,
          amount: payment.amount_fcfa ?? amount,
          transaction_id: transactionId,
        }),
      });
    }
  }

  if (payment.is_gift && payment.gift_recipient_phone) {
    const message = payment.gift_message
      ? `Vous avez reçu un abonnement WayaCloud en cadeau ! 🎉 Message: "${payment.gift_message}"`
      : "Vous avez reçu un abonnement WayaCloud en cadeau ! 🎉";
    console.log(`[SMS to ${payment.gift_recipient_phone}]: ${message}`);
  }

  if (!payment.is_gift) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", payment.user_id)
      .single();

    if (profile?.referred_by) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", profile.referred_by)
        .single();

      if (referrer) {
        const { data: existing } = await supabase
          .from("referral_rewards")
          .select("id")
          .eq("referrer_id", referrer.id)
          .eq("referred_id", payment.user_id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("referral_rewards").insert({
            referrer_id: referrer.id,
            referred_id: payment.user_id,
            reward_days: 30,
            granted_at: new Date().toISOString(),
            payment_id: payment.id,
          });

          const { data: sub } = await supabase
            .from("subscriptions")
            .select("ends_at")
            .eq("user_id", referrer.id)
            .eq("is_active", true)
            .maybeSingle();

          if (sub) {
            const currentEnd = sub.ends_at
              ? new Date(sub.ends_at).getTime()
              : Date.now();
            await supabase
              .from("subscriptions")
              .update({ ends_at: new Date(currentEnd + 30 * 86400000).toISOString() })
              .eq("user_id", referrer.id)
              .eq("is_active", true);
          }

          console.log(
            `[REFERRAL] User ${referrer.id} granted +30 days for referring ${payment.user_id}`,
          );
        }
      }
    }
  }

  return NextResponse.json({ message: "Paiement reçu et traité." });
}

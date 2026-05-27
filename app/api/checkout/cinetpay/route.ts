import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { planId, amount, name, promoCodeId, is_gift, gift_recipient_phone, gift_message } = await req.json();
    const supabase = createAdminSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const { data: plan } = await supabase
      .from("storage_plans")
      .select("id, name, monthly_price_fcfa, storage_go")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
    }

    if (plan.monthly_price_fcfa === 0) {
      return NextResponse.json({ error: "Ce plan est gratuit." }, { status: 400 });
    }

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    if (!apiKey || !siteId) {
      console.warn("CinetPay keys missing, using dummy payment URL for local testing.");
      return NextResponse.json({
        paymentUrl: `/abonnement?dummy_success=true&plan=${planId}`,
      });
    }

    const transactionId = `waya_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    await supabase.from("payments").insert({
      user_id: user.id,
      plan_id: plan.id,
      cinetpay_transaction_id: transactionId,
      amount_fcfa: amount,
      status: "pending",
      promo_code_id: promoCodeId || null,
      is_gift: is_gift || false,
      gift_recipient_phone: gift_recipient_phone || null,
      gift_message: gift_message || null,
    });

    if (promoCodeId) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("used_count")
        .eq("id", promoCodeId)
        .single();
      if (promo) {
        await supabase
          .from("promo_codes")
          .update({ used_count: (promo.used_count || 0) + 1 })
          .eq("id", promoCodeId);
      }
    }

    const payload = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
      amount: amount,
      currency: "XOF",
      description: `Paiement abonnement WayaCloud - ${name}`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/abonnement`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhook/cinetpay`,
      customer_name: "Utilisateur",
      customer_surname: "WayaCloud",
      customer_email: "test@wayacloud.bf",
      customer_phone_number: "00000000",
      customer_address: "Ouagadougou",
      customer_city: "Ouagadougou",
      customer_country: "BF",
      customer_state: "BF",
      customer_zip_code: "00000",
    };

    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code === "201" && data.data && data.data.payment_url) {
      return NextResponse.json({ paymentUrl: data.data.payment_url });
    } else {
      console.error("CinetPay init failed:", data);
      throw new Error(data.message || "Erreur d'initialisation du paiement");
    }
  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}

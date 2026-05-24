import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { planId, amount, name } = await req.json();

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    if (!apiKey || !siteId) {
      console.warn("CinetPay keys missing, using dummy payment URL for local testing.");
      return NextResponse.json({
        paymentUrl: `/abonnement?dummy_success=true&plan=${planId}`,
      });
    }

    const transactionId = `waya_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

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

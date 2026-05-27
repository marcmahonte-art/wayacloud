import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

interface SmsQueueItem {
  id: number;
  phone: string;
  message: string;
  status: string;
}

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    return new Response("Missing Supabase credentials", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: queue, error: fetchError } = await supabase
    .from("sms_queue")
    .select("id, phone, message, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error("Failed to fetch SMS queue:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!queue || queue.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }));
  }

  let sentCount = 0;
  let failedCount = 0;

  const hasTwilio = twilioSid && twilioToken && twilioPhone;

  for (const item of queue as SmsQueueItem[]) {
    try {
      if (hasTwilio) {
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: item.phone,
              From: twilioPhone,
              Body: item.message,
            }),
          },
        );

        if (!twilioRes.ok) {
          const twilioError = await twilioRes.text();
          throw new Error(`Twilio error: ${twilioError}`);
        }
      } else {
        console.log(`[SMS SIMULATED] To: ${item.phone} | Message: ${item.message}`);
      }

      await supabase
        .from("sms_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", item.id);

      sentCount++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to send SMS to ${item.phone}:`, errMsg);

      await supabase
        .from("sms_queue")
        .update({ status: "failed", error: errMsg })
        .eq("id", item.id);

      failedCount++;
    }
  }

  return new Response(
    JSON.stringify({ sent: sentCount, failed: failedCount }),
    { headers: { "Content-Type": "application/json" } },
  );
});

"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validatePhone } from "@/lib/validators";

interface SendOtpState {
  ok: boolean;
  message: string;
}

export async function sendOtp(
  _previousState: SendOtpState,
  formData: FormData,
): Promise<SendOtpState> {
  const phone = String(formData.get("phone") ?? "").trim();

  if (!validatePhone(phone)) {
    return {
      ok: false,
      message: "Entrez un numéro burkinabè valide de 8 chiffres.",
    };
  }

  const formattedPhone = phone.startsWith("+226") ? phone : `+226${phone}`;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) {
    return {
      ok: false,
      message: "Impossible d'envoyer le code OTP pour le moment.",
    };
  }

  return {
    ok: true,
    message: "Code OTP envoyé par SMS.",
  };
}

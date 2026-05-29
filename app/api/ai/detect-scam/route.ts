import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

const schema = z.object({ text: z.string().min(1).max(10000) });

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Texte invalide" }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.2,
      system: "Tu es un expert en cybersécurité au Burkina Faso. Analyse le message fourni et indique clairement s'il s'agit d'une arnaque. Donne un verdict clair : [ARNAQUE CONFIRMÉE], [SUSPECT] ou [SÉCURISÉ], suivi d'une brève explication.",
      messages: [{ role: "user", content: body.data.text }],
    });

    const resultText = response.content.find(c => c.type === "text");

    if (user) {
      logActivity({
        userId: user.id,
        type: "ai_action",
        title: "Détection d'arnaque IA",
        description: `Analyse d'un message de ${body.data.text.length} caractères`,
        metadata: { tool: "detect-scam", input_length: body.data.text.length },
      });
    }

    return NextResponse.json({ result: resultText && "text" in resultText ? resultText.text : "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

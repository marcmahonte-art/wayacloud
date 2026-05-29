import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

const summarySchema = z.object({
  text: z.string().min(1).max(20000),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = summarySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ message: "Texte à résumer invalide." }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 600,
      system: "Tu es un assistant IA spécialisé dans le résumé de documents pour WayaCloud. Résume le texte de manière claire et concise en français.",
      messages: [{ role: "user", content: body.data.text }],
    });

    const resultText = response.content.find(c => c.type === "text");

    if (user) {
      logActivity({
        userId: user.id,
        type: "ai_action",
        title: "Résumé IA",
        description: `Résumé de ${body.data.text.length} caractères généré`,
        metadata: { tool: "summarize", input_length: body.data.text.length },
      });
    }

    return NextResponse.json({ summary: resultText && "text" in resultText ? resultText.text : "" });
  } catch (error: any) {
    return NextResponse.json({ message: "Erreur lors du résumé : " + error.message }, { status: 500 });
  }
}

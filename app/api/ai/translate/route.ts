import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ 
  text: z.string().min(1).max(10000),
  targetLang: z.string().min(2).max(50)
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3,
      system: `Tu es un traducteur expert. Traduis le texte fourni vers : ${body.data.targetLang}. Ne renvoie que la traduction, sans aucun autre commentaire.`,
      messages: [{ role: "user", content: body.data.text }],
    });
    
    const resultText = response.content.find(c => c.type === "text");
    return NextResponse.json({ result: resultText && "text" in resultText ? resultText.text : "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  image: z.string(), // base64
  mediaType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Image invalide" }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.2,
      system: "Tu es un système de tri de documents. Identifie le type de document (CNIB, Reçu Orange Money, Facture, Acte) et extrais les informations clés sous forme de liste. Ne renvoie que ces informations, de façon très structurée.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.data.mediaType,
                data: body.data.image,
              },
            },
            {
              type: "text",
              text: "Quel est ce document et quelles en sont les informations clés ?"
            }
          ]
        }
      ],
    });
    
    const resultText = response.content.find(c => c.type === "text");
    return NextResponse.json({ result: resultText && "text" in resultText ? resultText.text : "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

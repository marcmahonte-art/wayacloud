import { NextResponse } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
});

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

export async function POST(request: Request) {
  const body = chatSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ message: "Message invalide." }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system:
        "Tu es l'assistant WayaCloud. Réponds en français clair, avec des montants en FCFA et le stockage en Go.",
      messages: [{ role: "user", content: body.data.message }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "L'assistant IA est momentanément indisponible." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  return NextResponse.json({ answer: data.content[0]?.text ?? "" });
}

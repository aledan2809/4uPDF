import { NextRequest, NextResponse } from "next/server";
import { routeAI } from "@/lib/ai-router";
import type { AIRequest } from "@/lib/ai-router";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, model, temperature } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (
        !msg.role ||
        typeof msg.role !== "string" ||
        !msg.content ||
        typeof msg.content !== "string"
      ) {
        return NextResponse.json(
          { error: "Each message must have a string role and content" },
          { status: 400 }
        );
      }
    }

    const aiRequest: AIRequest = { messages };
    if (provider) aiRequest.provider = provider;
    if (model) aiRequest.model = model;
    if (temperature !== undefined) aiRequest.temperature = temperature;

    const response = await routeAI(aiRequest);

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

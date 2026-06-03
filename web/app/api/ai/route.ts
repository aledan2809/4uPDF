import { NextRequest, NextResponse } from "next/server";
import { routeAI } from "@/lib/ai-router";
import type { AIRequest } from "@/lib/ai-router";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

// AI calls cost real money (LLM credits). Gate this endpoint to
// logged-in 4uPDF users only. The Python backend (api.py) is the
// session source-of-truth, so validate the Bearer token against it
// instead of duplicating auth logic here.
async function requireLoggedInUser(
  request: NextRequest
): Promise<NextResponse | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const verify = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });
    if (!verify.ok) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireLoggedInUser(request);
    if (authError) return authError;

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

// ═══════════════════════════════════════════════════════
// 4uPDF — AI Router Integration
// ═══════════════════════════════════════════════════════
//
// Centralizes AI calls through AIRouter with preset '4updf'.
// Provider priority: free providers first, fallback to Claude.

import { AIRouter, getProjectPreset } from "ai-router";
import type { AIRequest, AIResponse } from "ai-router";

const preset = getProjectPreset("4updf");
const router = new AIRouter(preset);

/**
 * Route an AI request through the 4uPDF preset.
 * Free providers are tried first; falls back to Claude on failure.
 *
 * @param request - AI request (messages, optional provider/model/temperature)
 * @returns AI response with content, provider used, latency, and fallback info
 */
export async function routeAI(request: AIRequest): Promise<AIResponse> {
  return router.chat(request);
}

export { router, preset };
export type { AIRequest, AIResponse };

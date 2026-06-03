"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ToolPageLayout from "../../components/ToolPageLayout";
import { useAuth } from "../../lib/auth";

// --- Chat configuration ---------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Keeps the AI focused on 4uPDF + PDF help, and steers users toward the
// right tool instead of answering arbitrary off-topic prompts (the endpoint
// costs real LLM credits, so we want every call to serve the product).
const SYSTEM_PROMPT = [
  "You are the 4uPDF Assistant, a friendly helper embedded in 4uPDF.com,",
  "a free online platform with 40+ PDF tools (merge, split, compress,",
  "convert to/from Word/Excel/JPG, OCR, extract text, watermark, protect,",
  "sign, rotate, organize, and smart tools like invoice/receipt extraction).",
  "Help users accomplish PDF tasks: explain how to do something, recommend",
  "the most suitable 4uPDF tool, and give concise, practical steps.",
  "When you recommend a tool, mention its name clearly (e.g. \"Compress PDF\").",
  "Keep answers short and actionable. If a request is unrelated to documents",
  "or PDFs, gently steer the conversation back to how 4uPDF can help.",
  "Never ask the user to paste full document contents here.",
].join(" ");

// Cap the history we send upstream so a long conversation can't balloon
// token cost (and latency) without bound. We keep the most recent turns.
const MAX_HISTORY_MESSAGES = 12;
const MAX_INPUT_CHARS = 2000;

const SUGGESTED_PROMPTS = [
  "Which tool should I use to make my PDF smaller for email?",
  "How do I combine several PDFs into one file?",
  "How can I convert a PDF to an editable Word document?",
  "What's the best way to extract data from invoices?",
];

const faqs = [
  {
    question: "What can the 4uPDF Assistant help with?",
    answer:
      "It answers questions about PDF tasks and points you to the right 4uPDF tool — for example which tool to use for compressing, merging, converting, or extracting data from PDFs, and how to use it.",
  },
  {
    question: "Do I need an account to use the Assistant?",
    answer:
      "Yes. The Assistant uses AI to generate responses, so it is available to signed-in 4uPDF users. Creating an account is free.",
  },
  {
    question: "Can I upload a PDF into the chat?",
    answer:
      "Not yet — the Assistant is text-based and is best for guidance and tool recommendations. To actually process a file, use the matching tool it recommends (such as Merge PDF or Compress PDF).",
  },
  {
    question: "Is my conversation stored?",
    answer:
      "Your conversation lives only in your browser during the session and is cleared when you reset the chat or leave the page.",
  },
];

const relatedTools = [
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs into one" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
  { name: "PDF to Word", href: "/tools/pdf-to-word", description: "Convert PDF to editable Word" },
];

const benefits = [
  "Instant guidance on any PDF task",
  "Recommends the right 4uPDF tool for the job",
  "Step-by-step, practical answers",
  "No file upload needed for advice",
  "Free with a 4uPDF account",
  "Works on any device",
];

const howItWorks = [
  { title: "Ask a Question", description: "Describe what you want to do with your PDF in plain language." },
  { title: "Get Guidance", description: "The Assistant explains how and recommends the best 4uPDF tool." },
  { title: "Use the Tool", description: "Open the recommended tool and finish the job in seconds." },
];

// --- Component ------------------------------------------------------------

export default function AiAssistantPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Atomic re-entrancy guard: `sending` state updates asynchronously, so a
  // rapid second trigger (Enter held, double-clicked suggestion) could slip
  // past the state check and build its message off a stale `messages` array.
  const inFlightRef = useRef(false);

  // Auto-scroll to the latest message as the conversation grows.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || inFlightRef.current) return;

      const token = getToken();
      if (!token) {
        setError("Please sign in to use the Assistant.");
        return;
      }

      inFlightRef.current = true;
      setError(null);
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(nextMessages);
      setInput("");
      setSending(true);

      try {
        const history = nextMessages.slice(-MAX_HISTORY_MESSAGES);
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
            temperature: 0.4,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setError("Your session has expired. Please sign in again to continue.");
          return;
        }
        if (!res.ok) {
          throw new Error(data?.error || "The Assistant is temporarily unavailable. Please try again.");
        }

        const reply = typeof data?.content === "string" ? data.content.trim() : "";
        if (!reply) {
          throw new Error("The Assistant returned an empty response. Please try again.");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        inFlightRef.current = false;
        setSending(false);
      }
    },
    [messages, getToken]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  return (
    <ToolPageLayout
      title="AI PDF Assistant"
      description="Ask anything about working with PDFs and get instant guidance plus a recommendation for the right 4uPDF tool — from compressing and merging to converting and extracting data."
      hideAdBanners
      howItWorks={howItWorks}
      benefits={benefits}
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8">
        {authLoading ? (
          <div className="py-16 text-center text-gray-400" aria-live="polite">
            Loading…
          </div>
        ) : !user ? (
          // Login gate — the AI endpoint is restricted to signed-in users.
          <div className="py-10 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0v4m-9 0h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to chat with the Assistant</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              The AI PDF Assistant is available to 4uPDF members. Create a free account or sign in to get started.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ minHeight: "28rem" }}>
            {/* Conversation */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
              style={{ maxHeight: "32rem" }}
              role="log"
              aria-live="polite"
              aria-label="Conversation with the AI PDF Assistant"
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">Hi! Ask me anything about working with PDFs.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => send(prompt)}
                        className="text-left text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-100 border border-gray-700"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                    <span className="inline-flex gap-1" aria-label="Assistant is typing">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-3 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSubmit} className="border-t border-gray-800 pt-4">
              <label htmlFor="ai-assistant-input" className="sr-only">
                Ask the AI PDF Assistant
              </label>
              <div className="flex items-end gap-2">
                <textarea
                  id="ai-assistant-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  maxLength={MAX_INPUT_CHARS}
                  placeholder="Ask about merging, compressing, converting…"
                  disabled={sending}
                  className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || input.trim().length === 0}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Press Enter to send · Shift+Enter for a new line
                </p>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={resetChat}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Clear conversation
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

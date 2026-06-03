"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Video, ChevronRight, RotateCcw } from "lucide-react";
import { Nav } from "@/components/Nav";
import { MOCK_CHAT } from "@/lib/athleteData";
import type { ChatMessage } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "Why is my lower back getting tight?",
  "How can I increase my bar path consistency?",
  "What should I work on this week?",
  "Compare my progress to last month",
  "How do I improve my jump shot consistency?",
  "What injury risks should I watch for?",
];

const AI_RESPONSES: Record<string, string> = {
  default: `Based on your recent analyses, here's what I recommend focusing on this week:

**Priority 1 — Lumbar Bracing (Deadlift)**
Your lumbar flexion dropped to 18° in your last heavy session. Before your next session:
- McGill Big 3 x 10 min
- Brace breath drills with a belt

**Priority 2 — Jump Shot Alignment (Basketball)**
Your jump still drifts ~8° left. 3 sets of 20 shots using alignment tape daily.

**Priority 3 — Ankle Mobility (General)**
Your ankle dorsiflexion is limiting your squat and pull positions. 2 min wall stretch each side, twice daily.

Want me to build you a full weekly training plan around these?`,
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: AI_RESPONSES.default,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
      setLoading(false);
    }, 1800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages(MOCK_CHAT.slice(0, 1));
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Nav />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="shrink-0 px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)", boxShadow: "0 0 16px rgba(14,165,233,0.3)" }}
            >
              <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>AI Performance Coach</div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                Online · Analyzing your data
              </div>
            </div>
          </div>
          <button
            onClick={reset}
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-tertiary)", border: "1px solid var(--border)" }}
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                {msg.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)" }}
                  >
                    <Zap style={{ width: 14, height: 14, color: "white" }} />
                  </div>
                )}
                {msg.role === "user" && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white" }}
                  >
                    AR
                  </div>
                )}

                {/* Bubble */}
                <div className={`flex-1 ${msg.role === "user" ? "flex justify-end" : ""}`}>
                  <div
                    className="max-w-[80%] p-4 rounded-2xl"
                    style={
                      msg.role === "user"
                        ? {
                            background: "rgba(14,165,233,0.12)",
                            border: "1px solid rgba(14,165,233,0.2)",
                            borderTopRightRadius: 4,
                          }
                        : {
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderTopLeftRadius: 4,
                          }
                    }
                  >
                    {msg.referencedAnalysis && (
                      <div
                        className="flex items-center gap-1.5 mb-2 text-xs px-2 py-1 rounded-lg w-fit"
                        style={{ background: "rgba(14,165,233,0.1)", color: "#38bdf8" }}
                      >
                        <Video className="w-3 h-3" />
                        Referencing analysis
                      </div>
                    )}
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: "var(--text-primary)" }}
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
                          .replace(/✅|❌|⚠️|✓/g, (m) => `<span>${m}</span>`),
                      }}
                    />
                    <div className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)" }}
                  >
                    <Zap style={{ width: 14, height: 14, color: "white" }} />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl flex items-center gap-2"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: 4 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#0ea5e9" }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Suggested questions */}
        {messages.length < 4 && (
          <div className="px-6 pb-2">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Suggested:</p>
              <div className="flex gap-2 flex-wrap">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: "rgba(14,165,233,0.08)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "#38bdf8",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,165,233,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(14,165,233,0.08)")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div
          className="shrink-0 px-6 py-4"
          style={{ borderTop: "1px solid var(--border)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(20px)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="flex items-end gap-3 p-3 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask your AI coach anything about your training…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
                style={{
                  color: "var(--text-primary)",
                  maxHeight: 120,
                  scrollbarWidth: "thin",
                }}
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "var(--text-tertiary)" }}>
              AI references your last 4 video analyses for personalized responses
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

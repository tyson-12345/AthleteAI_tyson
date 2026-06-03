"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Video, RotateCcw } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MOCK_CHAT } from "@/lib/athleteData";
import type { ChatMessage } from "@/lib/types";

const SUGGESTED = [
  "Why is my lower back tight?",
  "What should I work on this week?",
  "Compare my form to Curry",
  "How do I improve my sprint?",
];

const AI_REPLY = `Based on your recent analyses, here's your focus for this week:

**Priority 1 — Lumbar Bracing**
Your lumbar flexion was 18° in your last heavy session. Before lifting:
• McGill Big 3 × 10 min
• Brace breath drills

**Priority 2 — Jump Shot Alignment**
Your jump drifts ~8° left. Use alignment tape on floor, 3 × 20 shots daily.

**Priority 3 — Ankle Mobility**
2 min wall stretch each side, twice daily before training.

Want me to build a full weekly plan around these?`;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", content: AI_REPLY, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14"
        style={{ background: "rgba(6,10,16,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 14px rgba(6,182,212,0.35)" }}>
            <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>AI Performance Coach</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-xs" style={{ color: "#10b981" }}>Online</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages(MOCK_CHAT.slice(0, 1))}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <RotateCcw className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: messages.length < 4 ? 120 : 80 }}>
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.2) }}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "" : ""}`}
              style={msg.role === "assistant"
                ? { background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }
                : { background: "linear-gradient(135deg, #06b6d4, #0284c7)", fontSize: 11, fontWeight: 700, color: "white" }}>
              {msg.role === "assistant"
                ? <Zap style={{ width: 14, height: 14, color: "white" }} />
                : "AR"}
            </div>

            {/* Bubble */}
            <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              {msg.referencedAnalysis && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs px-2 py-1 rounded-lg w-fit"
                  style={{ background: "rgba(6,182,212,0.1)", color: "#22d3ee" }}>
                  <Video className="w-3 h-3" /> Referencing analysis
                </div>
              )}
              <div className="px-4 py-3 rounded-2xl"
                style={msg.role === "user"
                  ? { background: "rgba(6,182,212,0.14)", border: "1px solid rgba(6,182,212,0.22)", borderTopRightRadius: 6 }
                  : { background: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: 6 }}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                      .replace(/^• /gm, '<span style="color:var(--accent)">• </span>')
                  }} />
              </div>
              <span className="text-xs mt-1 px-1" style={{ color: "var(--text-tertiary)" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2.5 items-end">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                <Zap style={{ width: 14, height: 14, color: "white" }} />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: 6 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ── */}
      {messages.length < 4 && (
        <div className="shrink-0 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUGGESTED.map((q) => (
              <button key={q} onClick={() => send(q)}
                className="shrink-0 text-xs px-3 py-2 rounded-full transition-all"
                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-4 py-3 pb-safe"
        style={{
          background: "rgba(6,10,16,0.92)", backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: `calc(72px + max(12px, env(safe-area-inset-bottom)) + 8px)`,
        }}>
        <div className="flex items-end gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your coach anything…" rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            style={{ color: "var(--text-primary)", maxHeight: 100 }} />
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => send()} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

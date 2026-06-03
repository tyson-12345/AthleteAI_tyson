"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, Check, Search, Zap, ChevronRight, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { SkeletonViewer } from "@/components/SkeletonViewer";
import { VideoUploadCard } from "@/components/VideoUploadCard";
import { PRO_ATHLETES } from "@/lib/athleteData";

const SPORT_EMOJI: Record<string, string> = {
  golf: "⛳", basketball: "🏀", fencing: "🤺", tennis: "🎾",
  gymnastics: "🤸", running: "🏃", weightlifting: "🏋️",
};

const RESULTS = {
  similarity: 71,
  breakdown: [
    { label: "Elbow Alignment", you: 87, pro: 88 },
    { label: "Release Height", you: 78, pro: 95 },
    { label: "Jump Consistency", you: 72, pro: 97 },
    { label: "Wrist Snap", you: 82, pro: 86 },
    { label: "Hip-Shoulder Sep.", you: 68, pro: 91 },
  ],
  recs: [
    "Straight vertical jump with alignment tape — 50 shots/day",
    "One-hand form shooting at 5 feet — 100 reps daily",
    "Hip rotation drill: hips 45ms before shoulders at apex",
  ],
};

export default function ComparePage() {
  const [selectedPro, setSelectedPro] = useState<typeof PRO_ATHLETES[0] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(false);

  const filtered = PRO_ATHLETES.filter(a =>
    !filter || a.name.toLowerCase().includes(filter.toLowerCase()) || a.sport.includes(filter.toLowerCase())
  );

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setResults(true); }, 2800);
  };

  if (results) {
    return (
      <div className="min-h-screen mb-nav" style={{ background: "var(--bg)" }}>
        <TopBar title="You vs Stephen Curry"
          right={
            <button onClick={() => { setResults(false); setUploaded(false); setSelectedPro(null); }}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
              New
            </button>
          }
        />

        <div className="px-4 pt-4 space-y-4 pb-4">
          {/* Similarity hero */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl text-center"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(6,182,212,0.08))", border: "1px solid rgba(139,92,246,0.22)" }}>
            <div className="text-7xl font-black mb-1" style={{ color: "#a78bfa" }}>{RESULTS.similarity}%</div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Similarity Score</div>
            <div className="h-2 rounded-full mt-4 mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${RESULTS.similarity}%` }} transition={{ duration: 1.2 }}
                className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Top 15% of athletes vs Curry. Your follow-through is nearly pro-level.</p>
          </motion.div>

          {/* Side-by-side skeletons */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-2 text-center" style={{ color: "var(--text-secondary)" }}>You</p>
              <SkeletonViewer sport="basketball" variant="basketball" className="h-48" />
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 text-center" style={{ color: "#f59e0b" }}>Curry 🏆</p>
              <div className="h-48 rounded-2xl overflow-hidden relative"
                style={{ border: "1px solid rgba(245,158,11,0.25)" }}>
                <SkeletonViewer sport="basketball" variant="basketball" className="h-full border-0 rounded-none" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(245,158,11,0.03)" }} />
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>Metric Comparison</h3>
            {RESULTS.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-secondary)" }}>{b.label}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ color: "#06b6d4" }}>You {b.you}</span>
                    <span style={{ color: "#f59e0b" }}>Pro {b.pro}</span>
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="absolute h-full rounded-full" style={{ width: `${b.pro}%`, background: "rgba(245,158,11,0.2)" }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${b.you}%` }} transition={{ duration: 0.7 }}
                    className="absolute h-full rounded-full" style={{ background: "linear-gradient(90deg, #06b6d466, #06b6d4)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recs */}
          <div className="p-4 rounded-2xl space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>How to Close the Gap</h3>
            {RESULTS.recs.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>{i + 1}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen mb-nav" style={{ background: "var(--bg)" }}>
      <TopBar title="Compare to Pro" />

      <div className="px-4 pt-4 space-y-4 pb-4">
        {/* Your video */}
        <div>
          <p className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>Your Video</p>
          <VideoUploadCard label="Upload Your Training Video" onUpload={() => setUploaded(true)} />
          {uploaded && (
            <div className="flex items-center gap-2 mt-2">
              <Check className="w-4 h-4" style={{ color: "#10b981" }} />
              <span className="text-sm" style={{ color: "#10b981" }}>Video ready for comparison</span>
            </div>
          )}
        </div>

        {/* Pro athlete */}
        <div>
          <p className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>Pro Athlete</p>
          {selectedPro ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(139,92,246,0.09)", border: "1px solid rgba(139,92,246,0.22)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "rgba(139,92,246,0.14)" }}>
                {SPORT_EMOJI[selectedPro.sport] || "🏅"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{selectedPro.name}</p>
                <p className="text-xs capitalize mt-0.5" style={{ color: "var(--text-secondary)" }}>{selectedPro.specialty}</p>
              </div>
              <button onClick={() => setSelectedPro(null)}>
                <X className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowModal(true)} className="w-full p-5 rounded-2xl text-center"
              style={{ border: "2px dashed rgba(139,92,246,0.28)", background: "rgba(139,92,246,0.04)" }}>
              <div className="text-3xl mb-2">🏆</div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Select a Pro Athlete</p>
              <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#a78bfa" }}>
                Browse athletes <ChevronRight className="w-3 h-3" />
              </p>
            </button>
          )}
        </div>

        {/* Popular picks */}
        <div>
          <p className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>Popular Comparisons</p>
          <div className="grid grid-cols-2 gap-3">
            {PRO_ATHLETES.slice(0, 4).map((pro) => (
              <motion.button key={pro.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedPro(pro)}
                className="p-4 rounded-2xl text-left"
                style={{
                  background: selectedPro?.id === pro.id ? "rgba(139,92,246,0.12)" : "var(--surface)",
                  border: `1px solid ${selectedPro?.id === pro.id ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
                }}>
                <div className="text-2xl mb-2">{SPORT_EMOJI[pro.sport] || "🏅"}</div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{pro.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{pro.specialty}</p>
                {selectedPro?.id === pro.id && <Check className="w-4 h-4 mt-2" style={{ color: "#a78bfa" }} />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        <motion.button whileTap={{ scale: 0.97 }} disabled={!uploaded || analyzing} onClick={analyze}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "white", boxShadow: "0 0 24px rgba(139,92,246,0.35)" }}>
          {analyzing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white" />
              Comparing mechanics…
            </>
          ) : (
            <><GitCompare className="w-5 h-5" /> Run AI Comparison</>
          )}
        </motion.button>
      </div>

      {/* Pro selector modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl overflow-hidden"
              style={{ background: "var(--surface-2)", maxHeight: "80vh" }}>
              <div className="p-4 pb-0">
                <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.15)" }} />
                <p className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>Choose a Pro Athlete</p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  <input className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    placeholder="Search athletes…" value={filter} onChange={(e) => setFilter(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "50vh" }}>
                {filtered.map((pro) => (
                  <button key={pro.id} className="w-full flex items-center gap-3 p-3 rounded-xl mb-1"
                    style={{ background: selectedPro?.id === pro.id ? "rgba(139,92,246,0.1)" : "transparent" }}
                    onClick={() => { setSelectedPro(pro); setShowModal(false); }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: "var(--surface)" }}>
                      {SPORT_EMOJI[pro.sport] || "🏅"}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{pro.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{pro.sport} · {pro.specialty}</p>
                    </div>
                    {selectedPro?.id === pro.id && <Check className="w-4 h-4" style={{ color: "#a78bfa" }} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, Upload, ChevronDown, Search, Check, Zap, ChevronRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SkeletonViewer } from "@/components/SkeletonViewer";
import { ScoreRing } from "@/components/ScoreRing";
import { VideoUploadCard } from "@/components/VideoUploadCard";
import { PRO_ATHLETES } from "@/lib/athleteData";

const SPORT_ICONS: Record<string, string> = {
  golf: "⛳", basketball: "🏀", fencing: "🤺", tennis: "🎾",
  gymnastics: "🤸", running: "🏃", weightlifting: "🏋️",
};

const COMPARISON_RESULTS = {
  similarity: 71,
  breakdown: [
    { label: "Elbow Alignment", you: 87, pro: 88, diff: -1, status: "great" },
    { label: "Release Height", you: 78, pro: 95, diff: -17, status: "improve" },
    { label: "Jump Consistency", you: 72, pro: 97, diff: -25, status: "improve" },
    { label: "Wrist Snap", you: 82, pro: 86, diff: -4, status: "good" },
    { label: "Hip-Shoulder Sep.", you: 68, pro: 91, diff: -23, status: "improve" },
    { label: "Follow-through", you: 91, pro: 93, diff: -2, status: "great" },
  ],
  recommendations: [
    "Focus 15 min/day on straight vertical jump using alignment tape on floor",
    "One-hand form shooting at 5 feet — 100 reps daily for guide hand timing",
    "Hip rotation drill: feel hips rotate 45ms before shoulder at apex of jump",
    "Film from front angle next session to verify jump alignment correction",
  ],
};

export default function ComparePage() {
  const [selectedPro, setSelectedPro] = useState<typeof PRO_ATHLETES[0] | null>(null);
  const [showProSelector, setShowProSelector] = useState(false);
  const [proFilter, setProFilter] = useState("");
  const [myVideoUploaded, setMyVideoUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(false);
  const [syncPlayback, setSyncPlayback] = useState(true);

  const filtered = PRO_ATHLETES.filter((a) =>
    !proFilter || a.name.toLowerCase().includes(proFilter.toLowerCase()) || a.sport.includes(proFilter.toLowerCase())
  );

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setResults(true); }, 3000);
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
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Pro Athlete Comparison</h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Compare your mechanics against world-class athletes
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
          >
            <GitCompare className="w-3.5 h-3.5" />
            AI Motion Comparison
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!results ? (
            <div className="max-w-5xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* My video */}
                <div>
                  <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Upload className="w-4 h-4" style={{ color: "#0ea5e9" }} />
                    Your Video
                  </h2>
                  <VideoUploadCard
                    label="Upload Your Training Video"
                    onUpload={() => setMyVideoUploaded(true)}
                  />
                  {myVideoUploaded && (
                    <div className="mt-3 flex items-center gap-2">
                      <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
                      <span className="text-sm" style={{ color: "#22c55e" }}>Jump shot analysis ready</span>
                    </div>
                  )}
                </div>

                {/* Pro athlete picker */}
                <div>
                  <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    Pro Athlete
                  </h2>

                  {!selectedPro ? (
                    <button
                      onClick={() => setShowProSelector(true)}
                      className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all py-12"
                      style={{ border: "2px dashed rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.04)" }}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: "rgba(139,92,246,0.1)" }}
                      >
                        🏆
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Select a Pro Athlete</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Or upload their video</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#a78bfa" }}>
                        Browse athletes <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ) : (
                    <div
                      className="p-5 rounded-2xl"
                      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                          style={{ background: "rgba(139,92,246,0.15)" }}
                        >
                          {SPORT_ICONS[selectedPro.sport] || "🏅"}
                        </div>
                        <div>
                          <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{selectedPro.name}</div>
                          <div className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>
                            {selectedPro.sport} · {selectedPro.specialty}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedPro.keyAttributes.map((attr) => (
                          <span
                            key={attr}
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedPro(null)}
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Change athlete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyze button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!myVideoUploaded || analyzing}
                  onClick={handleAnalyze}
                  className="flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color: "white",
                    boxShadow: "0 0 24px rgba(139,92,246,0.35)",
                  }}
                >
                  {analyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Comparing mechanics…
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-5 h-5" />
                      Run AI Comparison
                    </>
                  )}
                </motion.button>
              </div>

              {/* Quick examples */}
              <div className="mt-10">
                <p className="text-xs font-semibold mb-4 text-center" style={{ color: "var(--text-tertiary)" }}>
                  POPULAR COMPARISONS
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRO_ATHLETES.slice(0, 4).map((pro) => (
                    <motion.button
                      key={pro.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedPro(pro)}
                      className="p-4 rounded-xl text-left"
                      style={{
                        background: selectedPro?.id === pro.id ? "rgba(139,92,246,0.12)" : "var(--surface)",
                        border: `1px solid ${selectedPro?.id === pro.id ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
                      }}
                    >
                      <div className="text-2xl mb-2">{SPORT_ICONS[pro.sport] || "🏅"}</div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{pro.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{pro.specialty}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── RESULTS VIEW ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-6xl mx-auto px-6 py-8"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                    You vs Stephen Curry
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Jump Shot · Basketball · AI Comparison
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setResults(false); setMyVideoUploaded(false); setSelectedPro(null); }}
                    className="text-sm px-4 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    New Comparison
                  </button>
                  <button
                    onClick={() => setSyncPlayback(!syncPlayback)}
                    className="text-sm px-4 py-2 rounded-lg"
                    style={{
                      background: syncPlayback ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.05)",
                      color: syncPlayback ? "#38bdf8" : "var(--text-secondary)",
                      border: `1px solid ${syncPlayback ? "rgba(14,165,233,0.25)" : "var(--border)"}`,
                    }}
                  >
                    {syncPlayback ? "Sync: On" : "Sync: Off"}
                  </button>
                </div>
              </div>

              {/* Side-by-side skeleton */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Your Jump Shot</span>
                    <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(14,165,233,0.1)", color: "#38bdf8" }}>
                      Avg score: 84
                    </div>
                  </div>
                  <SkeletonViewer sport="basketball" variant="basketball" className="h-64" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Stephen Curry</span>
                    <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                      Elite reference
                    </div>
                  </div>
                  <div
                    className="h-64 rounded-2xl relative overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    <SkeletonViewer sport="basketball" variant="basketball" className="h-full border-0 rounded-none" />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(245,158,11,0.03)" }} />
                    <div
                      className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                    >
                      🏆 Elite
                    </div>
                  </div>
                </div>
              </div>

              {/* Similarity score */}
              <div
                className="p-5 rounded-2xl mb-6 flex items-center gap-8"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(14,165,233,0.06))", border: "1px solid rgba(139,92,246,0.2)" }}
              >
                <div className="text-center">
                  <div className="text-5xl font-black" style={{ color: "#a78bfa" }}>
                    {COMPARISON_RESULTS.similarity}%
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Similarity Score</div>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${COMPARISON_RESULTS.similarity}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #8b5cf6, #0ea5e9)" }}
                    />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    You&apos;re in the top 15% of athletes compared to Curry. Your follow-through and elbow alignment are nearly perfect. Focus on jump consistency and hip-shoulder separation to close the gap.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metric breakdown */}
                <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Metric Breakdown</h3>
                  <div className="space-y-4">
                    {COMPARISON_RESULTS.breakdown.map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span style={{ color: "#0ea5e9" }}>You: {m.you}</span>
                            <span style={{ color: "#f59e0b" }}>Pro: {m.pro}</span>
                            <span style={{ color: m.status === "great" ? "#22c55e" : m.status === "good" ? "#0ea5e9" : "#ef4444" }}>
                              {m.diff}
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="absolute h-full rounded-full"
                            style={{ width: `${m.pro}%`, background: "rgba(245,158,11,0.25)" }}
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.you}%` }}
                            transition={{ duration: 0.8 }}
                            className="absolute h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, #0ea5e980, #0ea5e9)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
                    How to Close the Gap
                  </h3>
                  <div className="space-y-3">
                    {COMPARISON_RESULTS.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Pro Athlete Selector Modal */}
      <AnimatePresence>
        {showProSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowProSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    placeholder="Search athletes…"
                    value={proFilter}
                    onChange={(e) => setProFilter(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-80 p-3">
                {filtered.map((pro) => (
                  <button
                    key={pro.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left mb-1 transition-all"
                    style={{ background: selectedPro?.id === pro.id ? "rgba(139,92,246,0.12)" : "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedPro?.id === pro.id ? "rgba(139,92,246,0.12)" : "transparent")}
                    onClick={() => { setSelectedPro(pro); setShowProSelector(false); }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: "var(--surface-2)" }}
                    >
                      {SPORT_ICONS[pro.sport] || "🏅"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{pro.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {pro.sport} · {pro.specialty}
                      </div>
                    </div>
                    {selectedPro?.id === pro.id && <Check className="w-4 h-4" style={{ color: "#a78bfa" }} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

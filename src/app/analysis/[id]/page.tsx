"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Pause, SkipBack, SkipForward, Layers,
  AlertTriangle, CheckCircle2, Info, ChevronRight, Dumbbell,
  Flame, Target, Activity, Share2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { ScoreRing } from "@/components/ScoreRing";
import { MetricBar } from "@/components/MetricBar";
import { SkeletonViewer } from "@/components/SkeletonViewer";
import { MOCK_ANALYSES } from "@/lib/athleteData";

const SEVERITY_COLORS = {
  info: { bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.25)", text: "#38bdf8", icon: Info },
  warning: { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)", text: "#eab308", icon: AlertTriangle },
  critical: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", text: "#ef4444", icon: AlertTriangle },
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Technique",
  "injury-risk": "Injury Risk",
  strength: "Strength",
  mobility: "Mobility",
  timing: "Timing",
};

type Params = { id: string };

export default function AnalysisPage({ params }: { params: Promise<Params> }) {
  // Demo: resolve to first analysis regardless of id
  const analysis = MOCK_ANALYSES[0];
  const [playing, setPlaying] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [activeTab, setActiveTab] = useState<"coaching" | "injury" | "drills">("coaching");
  const [selectedTip, setSelectedTip] = useState<string | null>(null);

  const highlightJoints = analysis.injuryRisks
    .filter((r) => r.risk > 30)
    .map((r) => r.joint);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Nav />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="shrink-0 px-6 py-4 flex items-center gap-4"
          style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(20px)" }}
        >
          <Link href="/dashboard">
            <button className="p-2 rounded-lg transition-all" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{analysis.title}</h1>
            <p className="text-xs capitalize" style={{ color: "var(--text-tertiary)" }}>
              {analysis.sport} · {analysis.duration}s · {new Date(analysis.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: showSkeleton ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)", color: showSkeleton ? "#38bdf8" : "var(--text-secondary)", border: `1px solid ${showSkeleton ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.08)"}` }}
              onClick={() => setShowSkeleton(!showSkeleton)}
            >
              <Layers className="w-3.5 h-3.5" />
              Skeleton
            </button>
            <button className="p-2 rounded-lg" style={{ color: "var(--text-tertiary)", border: "1px solid var(--border)" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video + Skeleton panel */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
            {/* Video area */}
            <div
              className="relative flex-1 rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: 0 }}
            >
              {showSkeleton ? (
                <div className="absolute inset-0">
                  <SkeletonViewer
                    sport={analysis.sport}
                    highlightJoints={highlightJoints}
                    variant="deadlift"
                    animated={playing}
                    className="h-full w-full border-0 rounded-none"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl opacity-20">🏋️</div>
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-2))" }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🏋️</div>
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Video preview</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Playback controls */}
              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: "linear-gradient(to top, rgba(8,12,20,0.9) 0%, transparent 100%)" }}
              >
                {/* Scrubber */}
                <div
                  className="w-full h-1 rounded-full mb-3 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <div className="h-full w-1/3 rounded-full" style={{ background: "#0ea5e9" }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}>
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#0ea5e9", boxShadow: "0 0 12px rgba(14,165,233,0.4)" }}
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                    </button>
                    <button className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}>
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>0:04 / 0:{analysis.duration.toString().padStart(2, "0")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {["0.25x", "0.5x", "1x", "2x"].map((speed) => (
                      <button
                        key={speed}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: speed === "1x" ? "rgba(14,165,233,0.2)" : "transparent",
                          color: speed === "1x" ? "#38bdf8" : "var(--text-tertiary)",
                        }}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Joint angles row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { joint: "Hip Angle", value: "112°", optimal: "95°", status: "warning" },
                { joint: "Knee Angle", value: "165°", optimal: "160-170°", status: "good" },
                { joint: "Lumbar", value: "18°", optimal: "<10°", status: "danger" },
              ].map((j) => (
                <div
                  key={j.joint}
                  className="p-3 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${j.status === "danger" ? "rgba(239,68,68,0.25)" : j.status === "warning" ? "rgba(234,179,8,0.2)" : "var(--border)"}`,
                  }}
                >
                  <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{j.joint}</div>
                  <div
                    className="text-lg font-black"
                    style={{ color: j.status === "danger" ? "#ef4444" : j.status === "warning" ? "#eab308" : "#22c55e" }}
                  >
                    {j.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    Optimal: {j.optimal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: analysis */}
          <div
            className="w-80 flex flex-col shrink-0 overflow-hidden"
            style={{ borderLeft: "1px solid var(--border)" }}
          >
            {/* Scores */}
            <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center justify-around">
                <ScoreRing score={analysis.scores.overall} size={72} label="Overall" />
                <ScoreRing score={analysis.scores.technique} size={60} color="#8b5cf6" label="Technique" />
                <ScoreRing score={analysis.scores.power} size={60} color="#22c55e" label="Power" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              {(["coaching", "injury", "drills"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-3 text-xs font-semibold capitalize transition-all"
                  style={{
                    color: activeTab === tab ? "#38bdf8" : "var(--text-tertiary)",
                    borderBottom: activeTab === tab ? "2px solid #0ea5e9" : "2px solid transparent",
                    background: activeTab === tab ? "rgba(14,165,233,0.05)" : "transparent",
                  }}
                >
                  {tab === "injury" ? "Injury Risk" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === "coaching" && (
                  <motion.div
                    key="coaching"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    {/* Strengths */}
                    <div>
                      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#22c55e" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> What You&apos;re Doing Right
                      </h3>
                      <div className="space-y-2">
                        {analysis.strengths.map((s) => (
                          <div key={s} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#22c55e" }} />
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#eab308" }}>
                        <Target className="w-3.5 h-3.5" /> Coaching Tips
                      </h3>
                      <div className="space-y-2">
                        {analysis.tips.map((tip) => {
                          const colors = SEVERITY_COLORS[tip.severity];
                          const Icon = colors.icon;
                          const expanded = selectedTip === tip.id;
                          return (
                            <motion.div
                              key={tip.id}
                              layout
                              className="rounded-xl overflow-hidden cursor-pointer"
                              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                              onClick={() => setSelectedTip(expanded ? null : tip.id)}
                            >
                              <div className="flex items-center gap-2 p-3">
                                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: colors.text }} />
                                <span className="text-xs font-semibold flex-1" style={{ color: colors.text }}>
                                  {tip.title}
                                </span>
                                <ChevronRight
                                  className="w-3.5 h-3.5 shrink-0 transition-transform"
                                  style={{ color: colors.text, transform: expanded ? "rotate(90deg)" : "none" }}
                                />
                              </div>
                              <AnimatePresence>
                                {expanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-3 pb-3"
                                  >
                                    <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
                                      {tip.description}
                                    </p>
                                    {tip.drill && (
                                      <div
                                        className="p-2 rounded-lg"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                                      >
                                        <div className="flex items-center gap-1 mb-1">
                                          <Dumbbell className="w-3 h-3" style={{ color: "#38bdf8" }} />
                                          <span className="text-xs font-semibold" style={{ color: "#38bdf8" }}>Drill</span>
                                        </div>
                                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tip.drill}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "injury" && (
                  <motion.div
                    key="injury"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-4"
                  >
                    {analysis.injuryRisks.map((risk) => {
                      const color = risk.risk > 50 ? "#ef4444" : risk.risk > 30 ? "#eab308" : "#22c55e";
                      return (
                        <div key={risk.joint} className="p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{risk.joint}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                              <span className="text-sm font-bold" style={{ color }}>{risk.risk}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${risk.risk}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
                            />
                          </div>
                          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{risk.description}</p>
                          <div className="flex items-start gap-1.5">
                            <Activity className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#38bdf8" }} />
                            <p className="text-xs" style={{ color: "#38bdf8" }}>{risk.prevention}</p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === "drills" && (
                  <motion.div
                    key="drills"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                      Personalized drill plan based on your analysis:
                    </p>
                    {analysis.improvements.map((imp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "rgba(14,165,233,0.15)", color: "#38bdf8" }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{imp}</p>
                        </div>
                      </div>
                    ))}
                    {analysis.tips
                      .filter((t) => t.drill)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl"
                          style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Dumbbell className="w-3.5 h-3.5" style={{ color: "#38bdf8" }} />
                            <span className="text-xs font-semibold" style={{ color: "#38bdf8" }}>{t.title}</span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.drill}</p>
                        </div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Compare CTA */}
            <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <Link href="/compare">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
                >
                  <Flame className="w-4 h-4" />
                  Compare to Pro Athlete
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

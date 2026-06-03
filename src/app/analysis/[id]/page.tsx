"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, CheckCircle2, AlertTriangle, Info, ChevronRight, Dumbbell, Share2, GitCompare } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { ScoreRing } from "@/components/ScoreRing";
import { SkeletonViewer } from "@/components/SkeletonViewer";
import { MOCK_ANALYSES } from "@/lib/athleteData";

const SEV = {
  info:     { bg: "rgba(6,182,212,0.09)",   border: "rgba(6,182,212,0.22)",   text: "#22d3ee", icon: Info },
  warning:  { bg: "rgba(245,158,11,0.09)",  border: "rgba(245,158,11,0.22)",  text: "#f59e0b", icon: AlertTriangle },
  critical: { bg: "rgba(244,63,94,0.09)",   border: "rgba(244,63,94,0.22)",   text: "#f43f5e", icon: AlertTriangle },
};

export default function AnalysisPage() {
  const analysis = MOCK_ANALYSES[0];
  const [tab, setTab] = useState<"coaching" | "injury" | "drills">("coaching");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const highlightJoints = analysis.injuryRisks.filter(r => r.risk > 30).map(r => r.joint);

  return (
    <div className="min-h-screen mb-nav" style={{ background: "var(--bg)" }}>
      <TopBar
        title={analysis.title}
        showBack
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: showSkeleton ? "rgba(6,182,212,0.14)" : "rgba(255,255,255,0.06)",
                color: showSkeleton ? "#22d3ee" : "var(--text-tertiary)",
                border: `1px solid ${showSkeleton ? "rgba(6,182,212,0.28)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <Layers className="w-3.5 h-3.5" /> AI
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Share2 className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            </button>
          </div>
        }
      />

      {/* ── Skeleton / Video ── */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl overflow-hidden" style={{ height: 240 }}>
          {showSkeleton ? (
            <SkeletonViewer sport={analysis.sport} variant="deadlift" highlightJoints={highlightJoints} className="h-full border-0 rounded-none" />
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-center">
                <div className="text-4xl mb-2">🏋️</div>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Video preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Joint angles */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { j: "Hip", v: "112°", opt: "95°", s: "warning" },
            { j: "Knee", v: "165°", opt: "160-170°", s: "good" },
            { j: "Lumbar", v: "18°", opt: "<10°", s: "danger" },
          ].map(({ j, v, opt, s }) => (
            <div key={j} className="p-3 rounded-xl text-center"
              style={{
                background: "var(--surface)",
                border: `1px solid ${s === "danger" ? "rgba(244,63,94,0.2)" : s === "warning" ? "rgba(245,158,11,0.15)" : "var(--border)"}`,
              }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{j}</div>
              <div className="text-base font-black"
                style={{ color: s === "danger" ? "#f43f5e" : s === "warning" ? "#f59e0b" : "#10b981" }}>{v}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{opt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Score row ── */}
      <div className="flex items-center justify-around px-4 py-5">
        <ScoreRing score={analysis.scores.overall} size={76} label="Overall" sublabel="/100" />
        <ScoreRing score={analysis.scores.technique} size={64} color="#8b5cf6" label="Technique" />
        <ScoreRing score={analysis.scores.power} size={64} color="#10b981" label="Power" />
        <ScoreRing score={analysis.scores.balance} size={64} color="#06b6d4" label="Balance" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex mx-4 rounded-xl overflow-hidden mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {(["coaching", "injury", "drills"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 py-2.5 text-xs font-semibold capitalize transition-all"
            style={{
              background: tab === t ? "rgba(6,182,212,0.14)" : "transparent",
              color: tab === t ? "#22d3ee" : "var(--text-tertiary)",
              borderBottom: tab === t ? "2px solid #06b6d4" : "2px solid transparent",
            }}>
            {t === "injury" ? "Injury" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 pb-4 space-y-3">
        <AnimatePresence mode="wait">

          {tab === "coaching" && (
            <motion.div key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Strengths */}
              <div className="p-4 rounded-2xl space-y-2"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                  <span className="text-xs font-bold" style={{ color: "#10b981" }}>WHAT YOU'RE DOING RIGHT</span>
                </div>
                {analysis.strengths.map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#10b981" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s}</p>
                  </div>
                ))}
              </div>

              {/* Tips */}
              {analysis.tips.map((tip) => {
                const c = SEV[tip.severity];
                const Icon = c.icon;
                const open = expanded === tip.id;
                return (
                  <motion.div key={tip.id} layout className="rounded-2xl overflow-hidden"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                    onClick={() => setExpanded(open ? null : tip.id)}>
                    <div className="flex items-center gap-3 p-4">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: c.text }} />
                      <span className="text-sm font-semibold flex-1" style={{ color: c.text }}>{tip.title}</span>
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-200"
                        style={{ color: c.text, transform: open ? "rotate(90deg)" : "none" }} />
                    </div>
                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4">
                          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{tip.description}</p>
                          {tip.drill && (
                            <div className="p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Dumbbell className="w-3.5 h-3.5" style={{ color: "#22d3ee" }} />
                                <span className="text-xs font-bold" style={{ color: "#22d3ee" }}>DRILL</span>
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tip.drill}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {tab === "injury" && (
            <motion.div key="i" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {analysis.injuryRisks.map((r) => {
                const col = r.risk > 50 ? "#f43f5e" : r.risk > 30 ? "#f59e0b" : "#10b981";
                return (
                  <div key={r.joint} className="p-4 rounded-2xl space-y-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{r.joint}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: col }} />
                        <span className="text-lg font-black" style={{ color: col }}>{r.risk}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${r.risk}%` }} transition={{ duration: 0.8 }}
                        className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${col}66, ${col})` }} />
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.description}</p>
                    <div className="p-2.5 rounded-xl flex items-start gap-2"
                      style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.12)" }}>
                      <Dumbbell className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#22d3ee" }} />
                      <p className="text-xs leading-relaxed" style={{ color: "#22d3ee" }}>{r.prevention}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "drills" && (
            <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Personalized drill plan based on your analysis:</p>
              {analysis.tips.filter(t => t.drill).map((t, i) => (
                <div key={t.id} className="p-4 rounded-2xl"
                  style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(6,182,212,0.2)", color: "#22d3ee" }}>{i + 1}</div>
                    <span className="text-sm font-semibold" style={{ color: "#22d3ee" }}>{t.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.drill}</p>
                </div>
              ))}
              {analysis.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>{i + 1}</div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{imp}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compare CTA */}
        <Link href="/compare">
          <motion.div whileTap={{ scale: 0.97 }} className="flex items-center gap-3 p-4 rounded-2xl mt-2"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)" }}>
            <GitCompare className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: "#a78bfa" }}>Compare to Pro Athlete</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>See how your form stacks up</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#a78bfa" }} />
          </motion.div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

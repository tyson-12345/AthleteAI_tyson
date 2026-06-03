"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload, Video, TrendingUp, Flame, Trophy, Zap,
  ChevronRight, Calendar, Activity, Plus, ArrowUpRight,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { ScoreRing } from "@/components/ScoreRing";
import { MetricBar } from "@/components/MetricBar";
import { VideoUploadCard } from "@/components/VideoUploadCard";
import { MOCK_ANALYSES, MOCK_ACHIEVEMENTS, MOCK_ATHLETE, MOCK_PROGRESS } from "@/lib/athleteData";
import { formatRelativeTime } from "@/lib/utils";

const SPORT_ICONS: Record<string, string> = {
  weightlifting: "🏋️",
  basketball: "🏀",
  running: "🏃",
  golf: "⛳",
  fencing: "🤺",
  tennis: "🎾",
  soccer: "⚽",
  swimming: "🏊",
  default: "🏅",
};

export default function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  const athlete = MOCK_ATHLETE;
  const latest = MOCK_ANALYSES[0];
  const prev = MOCK_PROGRESS[MOCK_PROGRESS.length - 2];
  const curr = MOCK_PROGRESS[MOCK_PROGRESS.length - 1];
  const delta = curr.scores.overall - prev.scores.overall;
  const unlocked = MOCK_ACHIEVEMENTS.filter((a) => a.unlockedAt);
  const locked = MOCK_ACHIEVEMENTS.filter((a) => !a.unlockedAt);

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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Good morning, Alex 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}
            >
              <Flame className="w-3.5 h-3.5" />
              {athlete.streakDays}-day streak
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", boxShadow: "0 0 16px rgba(14,165,233,0.3)" }}
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </motion.button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Upload area (collapsible) */}
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <VideoUploadCard
                label="Upload Training Video"
                onUpload={() => setTimeout(() => setShowUpload(false), 3000)}
              />
            </motion.div>
          )}

          {/* Top scores row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-2 lg:col-span-1 p-5 rounded-2xl flex flex-col items-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <ScoreRing score={latest.scores.overall} size={100} label="Overall Score" sublabel="/100" />
              <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: "#22c55e" }}>
                <ArrowUpRight className="w-3 h-3" />
                +{delta} from last session
              </div>
            </motion.div>

            {[
              { label: "Technique", value: latest.scores.technique, color: "#8b5cf6", icon: "🎯" },
              { label: "Power", value: latest.scores.power, color: "#22c55e", icon: "⚡" },
              { label: "Balance", value: latest.scores.balance, color: "#0ea5e9", icon: "⚖️" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 1) * 0.08 }}
                className="p-5 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="text-2xl font-black mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>{m.label}</div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color, boxShadow: `0 0 6px ${m.color}44` }} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Recent analyses */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Recent Analyses</h2>
                <Link href="/progress" className="text-sm flex items-center gap-1" style={{ color: "#38bdf8" }}>
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {MOCK_ANALYSES.map((analysis, i) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link href={`/analysis/${analysis.id}`}>
                      <div
                        className="card-hover flex items-center gap-4 p-4 rounded-xl cursor-pointer"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: "var(--surface-2)" }}
                        >
                          {SPORT_ICONS[analysis.sport] || SPORT_ICONS.default}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                              {analysis.title}
                            </span>
                            {analysis.comparedTo && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
                              >
                                vs Pro
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                            <span>{formatRelativeTime(analysis.uploadedAt)}</span>
                            <span>·</span>
                            <span>{analysis.duration}s</span>
                            <span>·</span>
                            <span className="capitalize">{analysis.sport}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-black" style={{ color: "#0ea5e9" }}>{analysis.scores.overall}</div>
                            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>score</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {analysis.injuryRisks.slice(0, 1).map((r) => (
                              <div
                                key={r.joint}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: r.risk > 50 ? "rgba(239,68,68,0.1)" : r.risk > 30 ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                                  color: r.risk > 50 ? "#ef4444" : r.risk > 30 ? "#eab308" : "#22c55e",
                                }}
                              >
                                {r.risk > 50 ? "⚠" : r.risk > 30 ? "~" : "✓"} {r.joint}
                              </div>
                            ))}
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Weekly goal */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Weekly Goal</h3>
                  <Calendar className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-black" style={{ color: "#0ea5e9" }}>{athlete.weeklyProgress}</span>
                  <span className="text-base mb-1" style={{ color: "var(--text-tertiary)" }}>/ {athlete.weeklyGoal} sessions</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(athlete.weeklyProgress / athlete.weeklyGoal) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #0ea5e9, #22d3ee)", boxShadow: "0 0 8px rgba(14,165,233,0.4)" }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                  1 more session to hit your goal!
                </p>
              </div>

              {/* Achievements */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Achievements</h3>
                  <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {unlocked.slice(0, 8).map((ach) => (
                    <div
                      key={ach.id}
                      title={ach.title}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
                    >
                      {ach.icon}
                    </div>
                  ))}
                  {locked.slice(0, 4).map((ach) => (
                    <div
                      key={ach.id}
                      title={`${ach.title} — ${ach.progress}/${ach.total}`}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", filter: "grayscale(1)", opacity: 0.4 }}
                    >
                      {ach.icon}
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {unlocked.length} of {MOCK_ACHIEVEMENTS.length} unlocked
                </p>
              </div>

              {/* Metrics summary */}
              <div className="p-5 rounded-2xl space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Skills Breakdown</h3>
                  <Activity className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                </div>
                <MetricBar label="Technique" value={latest.scores.technique} color="#8b5cf6" delta={+4} />
                <MetricBar label="Power" value={latest.scores.power} color="#22c55e" delta={+3} />
                <MetricBar label="Balance" value={latest.scores.balance} color="#0ea5e9" delta={-2} />
                <MetricBar label="Mobility" value={latest.scores.mobility} color="#f97316" delta={+6} />
                <MetricBar label="Consistency" value={latest.scores.consistency} color="#22d3ee" delta={+2} />
              </div>

              {/* AI Coach CTA */}
              <Link href="/chat">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 rounded-2xl cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.08))",
                    border: "1px solid rgba(14,165,233,0.2)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(14,165,233,0.15)" }}
                    >
                      <Zap className="w-5 h-5" style={{ color: "#38bdf8" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Ask Your AI Coach</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        &ldquo;Why is my squat unstable?&rdquo;
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#38bdf8" }} />
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

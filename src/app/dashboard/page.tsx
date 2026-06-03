"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Plus, Flame, ChevronRight, Zap, TrendingUp, Activity } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ScoreRing } from "@/components/ScoreRing";
import { VideoUploadCard } from "@/components/VideoUploadCard";
import { MOCK_ANALYSES, MOCK_ACHIEVEMENTS, MOCK_ATHLETE } from "@/lib/athleteData";

const SPORT_EMOJI: Record<string, string> = {
  weightlifting: "🏋️", basketball: "🏀", running: "🏃", golf: "⛳",
  fencing: "🤺", tennis: "🎾", soccer: "⚽", swimming: "🏊",
};

const METRIC_COLORS: Record<string, string> = {
  technique: "#8b5cf6", power: "#10b981", balance: "#06b6d4",
  mobility: "#f97316", consistency: "#22d3ee",
};

export default function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  const athlete = MOCK_ATHLETE;
  const latest = MOCK_ANALYSES[0];
  const unlocked = MOCK_ACHIEVEMENTS.filter((a) => a.unlockedAt);

  return (
    <div className="min-h-screen mb-nav" style={{ background: "var(--bg)" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-5 h-14"
        style={{ background: "rgba(6,10,16,0.88)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", boxShadow: "0 0 12px rgba(6,182,212,0.4)" }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>AthleteAI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            <Flame className="w-3 h-3" />
            {athlete.streakDays}d
          </div>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 pb-4 space-y-5">

        {/* ── Hero score ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden p-6"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(6,10,16,0) 100%)",
            border: "1px solid rgba(6,182,212,0.15)",
          }}
        >
          {/* Glow blob */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Good morning,</p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Alex Rivera 👋</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                <span className="text-xs font-semibold" style={{ color: "#10b981" }}>+3 pts from last session</span>
              </div>
            </div>
            <ScoreRing score={latest.scores.overall} size={90} sublabel="/100" />
          </div>

          {/* Weekly goal bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "var(--text-tertiary)" }}>Weekly Goal</span>
              <span style={{ color: "var(--accent)" }}>{athlete.weeklyProgress}/{athlete.weeklyGoal} sessions</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(athlete.weeklyProgress / athlete.weeklyGoal) * 100}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #06b6d4, #22d3ee)", boxShadow: "0 0 8px rgba(6,182,212,0.4)" }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Technique", value: latest.scores.technique, color: "#8b5cf6", icon: "🎯" },
            { label: "Power", value: latest.scores.power, color: "#10b981", icon: "⚡" },
            { label: "Balance", value: latest.scores.balance, color: "#06b6d4", icon: "⚖️" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-2xl font-black" style={{ color: m.color }}>{m.value}</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.label}</span>
              <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color, boxShadow: `0 0 6px ${m.color}66` }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── New analysis CTA ── */}
        {showUpload ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <VideoUploadCard label="Upload Training Video" onUpload={() => setTimeout(() => setShowUpload(false), 3500)} />
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.14), rgba(139,92,246,0.08))",
              border: "1px solid rgba(6,182,212,0.22)",
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Analyze Your Performance</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Upload a training video for AI coaching</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--accent)" }} />
          </motion.button>
        )}

        {/* ── Recent analyses ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Recent Sessions</h2>
            <Link href="/progress" className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {MOCK_ANALYSES.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
              >
                <Link href={`/analysis/${a.id}`}>
                  <div
                    className="card-press flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: "var(--surface-2)" }}>
                      {SPORT_EMOJI[a.sport] || "🏅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
                        {a.sport} · {a.duration}s
                        {a.comparedTo && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>vs Pro</span>}
                      </p>
                      {/* Mini score bars */}
                      <div className="flex gap-1.5 mt-2">
                        {[a.scores.technique, a.scores.power, a.scores.balance].map((s, j) => (
                          <div key={j} className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${s}%`,
                              background: [METRIC_COLORS.technique, METRIC_COLORS.power, METRIC_COLORS.balance][j]
                            }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>{a.scores.overall}</div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>score</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Achievements strip ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Achievements</h2>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{unlocked.length}/{MOCK_ACHIEVEMENTS.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {MOCK_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className="shrink-0 flex flex-col items-center gap-1.5"
                title={ach.title}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    background: ach.unlockedAt ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${ach.unlockedAt ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}`,
                    filter: ach.unlockedAt ? "none" : "grayscale(1)",
                    opacity: ach.unlockedAt ? 1 : 0.4,
                  }}
                >
                  {ach.icon}
                </div>
                <span className="text-xs text-center w-12 truncate" style={{ color: ach.unlockedAt ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                  {ach.title.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Coach CTA ── */}
        <Link href="/chat">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Ask Your AI Coach</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>"What should I work on this week?"</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#a78bfa" }} />
          </motion.div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

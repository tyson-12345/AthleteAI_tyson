"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Trophy, Zap, ArrowUpRight, Activity, Target, Flame } from "lucide-react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { LineChart } from "@/components/LineChart";
import { MetricBar } from "@/components/MetricBar";
import { ScoreRing } from "@/components/ScoreRing";
import { MOCK_PROGRESS, MOCK_ACHIEVEMENTS, MOCK_ANALYSES } from "@/lib/athleteData";

type MetricKey = "overall" | "technique" | "power" | "balance" | "consistency" | "mobility" | "speed";

const METRIC_OPTIONS: { key: MetricKey; label: string; color: string }[] = [
  { key: "overall", label: "Overall", color: "#0ea5e9" },
  { key: "technique", label: "Technique", color: "#8b5cf6" },
  { key: "power", label: "Power", color: "#22c55e" },
  { key: "balance", label: "Balance", color: "#22d3ee" },
  { key: "consistency", label: "Consistency", color: "#f97316" },
  { key: "mobility", label: "Mobility", color: "#f59e0b" },
  { key: "speed", label: "Speed", color: "#ec4899" },
];

const SPORT_ICONS: Record<string, string> = {
  weightlifting: "🏋️", basketball: "🏀", running: "🏃", golf: "⛳", fencing: "🤺",
};

export default function ProgressPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("overall");
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "all">("all");

  const metric = METRIC_OPTIONS.find((m) => m.key === activeMetric)!;
  const allData = MOCK_PROGRESS.map((p) => ({ date: p.date, value: p.scores[activeMetric] }));

  const filtered = (() => {
    const now = new Date("2026-06-01");
    const cutoffs: Record<string, number> = { "1m": 30, "3m": 90, "6m": 180, all: 999 };
    const days = cutoffs[timeRange];
    return allData.filter((d) => {
      const diff = (now.getTime() - new Date(d.date).getTime()) / 86400000;
      return diff <= days;
    });
  })();

  const first = filtered[0]?.value ?? 0;
  const last = filtered[filtered.length - 1]?.value ?? 0;
  const totalDelta = last - first;
  const totalSessions = MOCK_ANALYSES.length;
  const unlockedAch = MOCK_ACHIEVEMENTS.filter((a) => a.unlockedAt);

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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Progress Tracking</h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Your performance journey over time</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.25)" }}>
            <Flame className="w-3.5 h-3.5" />
            14-day streak
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Current Score", value: last, suffix: "", color: "#0ea5e9", icon: "📊" },
              { label: "Total Gain", value: `+${totalDelta}`, suffix: " pts", color: "#22c55e", icon: "📈" },
              { label: "Sessions", value: totalSessions, suffix: "", color: "#8b5cf6", icon: "🎬" },
              { label: "Achievements", value: unlockedAch.length, suffix: "", color: "#f59e0b", icon: "🏆" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black" style={{ color: stat.color }}>
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Chart */}
            <div className="lg:col-span-2 space-y-4">
              {/* Metric selector */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Performance Trend</h2>
                  <div className="flex gap-1">
                    {(["1m", "3m", "6m", "all"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{
                          background: timeRange === r ? "rgba(14,165,233,0.15)" : "transparent",
                          color: timeRange === r ? "#38bdf8" : "var(--text-tertiary)",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metric tabs */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {METRIC_OPTIONS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setActiveMetric(m.key)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                      style={{
                        background: activeMetric === m.key ? `${m.color}22` : "rgba(255,255,255,0.04)",
                        color: activeMetric === m.key ? m.color : "var(--text-tertiary)",
                        border: `1px solid ${activeMetric === m.key ? `${m.color}44` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Chart */}
                <div className="relative">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-3xl font-black" style={{ color: metric.color }}>{last}</span>
                      <span className="text-sm ml-1" style={{ color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#22c55e" }}>
                      <ArrowUpRight className="w-4 h-4" />
                      +{totalDelta} pts this period
                    </div>
                  </div>
                  <LineChart
                    data={filtered}
                    color={metric.color}
                    height={140}
                    showDots={filtered.length <= 10}
                    label={metric.label}
                  />
                </div>
              </div>

              {/* Session history */}
              <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Session History</h2>
                <div className="space-y-2">
                  {MOCK_ANALYSES.map((a, i) => (
                    <Link key={a.id} href={`/analysis/${a.id}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: "var(--surface-2)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: "var(--surface-3)" }}
                        >
                          {SPORT_ICONS[a.sport] || "🏅"}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{a.title}</div>
                          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(a.uploadedAt).toLocaleDateString()} · {a.duration}s
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          {["technique", "power", "balance"].map((key) => (
                            <div key={key} className="text-center hidden md:block">
                              <div className="text-sm font-bold" style={{ color: METRIC_OPTIONS.find(m => m.key === key)?.color }}>
                                {a.scores[key as MetricKey]}
                              </div>
                              <div className="text-xs capitalize" style={{ color: "var(--text-tertiary)" }}>{key.slice(0, 4)}</div>
                            </div>
                          ))}
                          <div className="text-right">
                            <div className="text-lg font-black" style={{ color: "#0ea5e9" }}>{a.scores.overall}</div>
                            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>overall</div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Radar-style breakdown */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Activity className="w-4 h-4" style={{ color: "#0ea5e9" }} />
                  Skills Snapshot
                </h3>
                <div className="space-y-3">
                  {METRIC_OPTIONS.slice(1).map((m) => {
                    const currVal = MOCK_PROGRESS[MOCK_PROGRESS.length - 1].scores[m.key];
                    const prevVal = MOCK_PROGRESS[MOCK_PROGRESS.length - 3].scores[m.key];
                    return (
                      <MetricBar
                        key={m.key}
                        label={m.label}
                        value={currVal}
                        color={m.color}
                        delta={currVal - prevVal}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Personal bests */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} />
                  Personal Bests
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Power", value: 91, sport: "Weightlifting", icon: "🏋️" },
                    { label: "Balance", value: 91, sport: "Basketball", icon: "🏀" },
                    { label: "Speed", value: 88, sport: "Sprint", icon: "🏃" },
                  ].map((pb) => (
                    <div key={pb.label} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
                      <span className="text-xl">{pb.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pb.label}</div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{pb.sport}</div>
                      </div>
                      <div className="text-xl font-black" style={{ color: "#f59e0b" }}>{pb.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
                  Achievements
                </h3>
                <div className="space-y-3">
                  {MOCK_ACHIEVEMENTS.map((ach) => (
                    <div key={ach.id} className={`flex items-center gap-3 ${!ach.unlockedAt ? "opacity-40" : ""}`}>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: ach.unlockedAt ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${ach.unlockedAt ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
                          filter: ach.unlockedAt ? "none" : "grayscale(1)",
                        }}
                      >
                        {ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: ach.unlockedAt ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                          {ach.title}
                        </div>
                        {!ach.unlockedAt && (
                          <div className="mt-1">
                            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${(ach.progress / ach.total) * 100}%`, background: "#0ea5e9" }}
                              />
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              {ach.progress}/{ach.total}
                            </div>
                          </div>
                        )}
                      </div>
                      {ach.unlockedAt && <div className="text-xs font-bold" style={{ color: "#f59e0b" }}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

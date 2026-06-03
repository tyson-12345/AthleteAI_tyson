"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, ArrowUpRight, Trophy } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { LineChart } from "@/components/LineChart";
import { MetricBar } from "@/components/MetricBar";
import { MOCK_PROGRESS, MOCK_ACHIEVEMENTS, MOCK_ANALYSES } from "@/lib/athleteData";

type MetricKey = "overall" | "technique" | "power" | "balance" | "consistency" | "mobility" | "speed";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "overall", label: "Overall", color: "#06b6d4" },
  { key: "technique", label: "Technique", color: "#8b5cf6" },
  { key: "power", label: "Power", color: "#10b981" },
  { key: "balance", label: "Balance", color: "#22d3ee" },
  { key: "consistency", label: "Consistency", color: "#f97316" },
  { key: "mobility", label: "Mobility", color: "#f59e0b" },
];

const SPORT_EMOJI: Record<string, string> = {
  weightlifting: "🏋️", basketball: "🏀", running: "🏃", golf: "⛳",
};

export default function ProgressPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("overall");
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "all">("all");

  const m = METRICS.find((x) => x.key === activeMetric)!;
  const allData = MOCK_PROGRESS.map((p) => ({ date: p.date, value: p.scores[activeMetric] }));

  const filtered = (() => {
    const now = new Date("2026-06-01");
    const days: Record<string, number> = { "1m": 30, "3m": 90, all: 999 };
    return allData.filter((d) => (now.getTime() - new Date(d.date).getTime()) / 86400000 <= days[timeRange]);
  })();

  const first = filtered[0]?.value ?? 0;
  const last = filtered[filtered.length - 1]?.value ?? 0;
  const delta = last - first;

  return (
    <div className="min-h-screen mb-nav" style={{ background: "var(--bg)" }}>
      <TopBar title="Progress" />

      <div className="px-4 pt-4 space-y-4">

        {/* ── Top stats ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Current Score", value: last, color: "#06b6d4", icon: "📊" },
            { label: "Total Gain", value: `+${delta}`, color: "#10b981", icon: "📈" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Streak + sessions ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.18)" }}>
            <Flame className="w-6 h-6" style={{ color: "#f97316" }} />
            <div>
              <div className="text-2xl font-black" style={{ color: "#f97316" }}>14</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Day Streak</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <Trophy className="w-6 h-6" style={{ color: "#f59e0b" }} />
            <div>
              <div className="text-2xl font-black" style={{ color: "#f59e0b" }}>{MOCK_ACHIEVEMENTS.filter(a => a.unlockedAt).length}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Achievements</div>
            </div>
          </div>
        </div>

        {/* ── Trend chart ── */}
        <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black" style={{ color: m.color }}>{last}</span>
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                <span className="text-xs font-semibold" style={{ color: "#10b981" }}>+{delta} pts</span>
              </div>
            </div>
            <div className="flex gap-1">
              {(["1m", "3m", "all"] as const).map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: timeRange === r ? `${m.color}22` : "transparent", color: timeRange === r ? m.color : "var(--text-tertiary)" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Metric selector pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {METRICS.map((mx) => (
              <button key={mx.key} onClick={() => setActiveMetric(mx.key)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background: activeMetric === mx.key ? `${mx.color}22` : "rgba(255,255,255,0.04)",
                  color: activeMetric === mx.key ? mx.color : "var(--text-tertiary)",
                  border: `1px solid ${activeMetric === mx.key ? `${mx.color}44` : "rgba(255,255,255,0.06)"}`,
                }}>
                {mx.label}
              </button>
            ))}
          </div>

          <LineChart data={filtered} color={m.color} height={120} showDots={filtered.length <= 10} />
        </div>

        {/* ── Skills breakdown ── */}
        <div className="p-4 rounded-2xl space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Skills Breakdown</h3>
          {METRICS.slice(1).map((mx) => {
            const curr = MOCK_PROGRESS[MOCK_PROGRESS.length - 1].scores[mx.key];
            const prev = MOCK_PROGRESS[MOCK_PROGRESS.length - 3].scores[mx.key];
            return <MetricBar key={mx.key} label={mx.label} value={curr} color={mx.color} delta={curr - prev} />;
          })}
        </div>

        {/* ── Session history ── */}
        <div>
          <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Session History</h3>
          <div className="space-y-2">
            {MOCK_ANALYSES.map((a, i) => (
              <Link key={a.id} href={`/analysis/${a.id}`}>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="card-press flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "var(--surface-2)" }}>
                    {SPORT_EMOJI[a.sport] || "🏅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(a.uploadedAt).toLocaleDateString()} · {a.duration}s
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black" style={{ color: "#06b6d4" }}>{a.scores.overall}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>overall</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Achievements ── */}
        <div>
          <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Achievements</h3>
          <div className="space-y-2">
            {MOCK_ACHIEVEMENTS.map((ach) => (
              <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-xl ${!ach.unlockedAt ? "opacity-40" : ""}`}
                style={{ background: "var(--surface-2)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{
                    background: ach.unlockedAt ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ach.unlockedAt ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
                    filter: ach.unlockedAt ? "none" : "grayscale(1)",
                  }}>
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{ach.title}</p>
                  {!ach.unlockedAt && (
                    <div className="mt-1">
                      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(ach.progress / ach.total) * 100}%`, background: "#06b6d4" }} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{ach.progress}/{ach.total}</p>
                    </div>
                  )}
                </div>
                {ach.unlockedAt && <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ChevronRight, Play, Check, Star, Video, TrendingUp,
  Shield, GitCompare, MessageSquare, Trophy, ArrowRight, Menu, X
} from "lucide-react";

const HERO_SPORTS = ["Fencing", "Weightlifting", "Basketball", "Golf", "Tennis", "Running", "Swimming"];

const FEATURES = [
  {
    icon: Video,
    title: "AI Motion Analysis",
    description: "Frame-by-frame biomechanics analysis using computer vision. Detect joint angles, posture, velocity, balance, and symmetry.",
    color: "#0ea5e9",
  },
  {
    icon: MessageSquare,
    title: "AI Coach Feedback",
    description: "Personalized coaching tips from an AI trained on elite performance data. Understand what you're doing right and exactly how to improve.",
    color: "#8b5cf6",
  },
  {
    icon: Shield,
    title: "Injury Prevention",
    description: "Detect dangerous movement patterns before they cause injury. Get injury risk scores, joint stress alerts, and corrective exercise plans.",
    color: "#f97316",
  },
  {
    icon: GitCompare,
    title: "Pro Athlete Comparison",
    description: "Upload a pro athlete's video and compare your mechanics side-by-side. Get a similarity score and actionable improvement roadmap.",
    color: "#22c55e",
  },
  {
    icon: TrendingUp,
    title: "Performance Dashboard",
    description: "Track technique, power, balance, mobility, and consistency scores over time. Watch your progress curves climb week by week.",
    color: "#22d3ee",
  },
  {
    icon: Trophy,
    title: "Gamified Progress",
    description: "Skill scores out of 100, achievement badges, weekly goals, and personalized training plans keep you motivated and on track.",
    color: "#f59e0b",
  },
];

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    sport: "Powerlifter",
    quote: "My deadlift went from 180kg to 220kg after fixing the hip mechanics AthleteAI flagged. The injury risk score alone is worth it.",
    score: 94,
    avatar: "MT",
  },
  {
    name: "Priya K.",
    sport: "Fencer",
    quote: "I compared my lunge to Lee Kiefer's and the AI broke down every millisecond of timing difference. My coach was blown away.",
    score: 88,
    avatar: "PK",
  },
  {
    name: "James L.",
    sport: "Basketball",
    quote: "My shooting percentage jumped 12% in one month following the jump alignment drills from my analysis. The specificity is insane.",
    score: 91,
    avatar: "JL",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Get started with AI motion analysis",
    features: [
      "3 video analyses per month",
      "Basic coaching feedback",
      "Overall performance score",
      "7-day history",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$24",
    period: "/month",
    description: "For serious athletes training consistently",
    features: [
      "Unlimited video analyses",
      "Full biomechanics breakdown",
      "Injury risk scores & prevention",
      "Pro athlete comparisons",
      "AI Coach Chat",
      "Progress tracking & trends",
      "Drill & training plan library",
    ],
    cta: "Start 7-Day Free Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$79",
    period: "/month",
    description: "For coaches and elite performers",
    features: [
      "Everything in Pro",
      "Team & athlete accounts (up to 20)",
      "Side-by-side session comparison",
      "Coach dashboard & annotations",
      "API access",
      "Priority support",
      "Custom training programs",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  const [sportIndex, setSportIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSportIndex((i) => (i + 1) % HERO_SPORTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
      {/* ── NAVBAR ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          background: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">AthleteAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Compare", "Progress", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard">
            <button className="text-sm px-4 py-2 rounded-lg transition-all" style={{ color: "var(--text-secondary)" }}>
              Sign In
            </button>
          </Link>
          <Link href="/dashboard">
            <button
              className="text-sm px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", boxShadow: "0 0 20px rgba(14,165,233,0.3)" }}
            >
              Start Free
            </button>
          </Link>
        </div>
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: "var(--text-secondary)" }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[61px] left-0 right-0 z-40 p-4"
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3">
              {["Features", "Compare", "Progress", "Pricing"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm py-2" style={{ color: "var(--text-secondary)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full text-sm py-2.5 rounded-lg font-semibold mt-2"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white" }}
                >
                  Get Started Free
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 text-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.3)",
              color: "#38bdf8",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            AI-Powered Sports Coaching · Now in Beta
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="gradient-text-hero">Elite coaching.</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>For every</span>{" "}
            <span className="relative inline-block overflow-hidden" style={{ minWidth: "280px" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={HERO_SPORTS[sportIndex]}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="inline-block gradient-text-energy"
                >
                  {HERO_SPORTS[sportIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Upload your training video and get frame-by-frame biomechanics analysis, personalized AI coaching feedback, injury prevention insights, and pro athlete comparisons — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "white",
                  boxShadow: "0 0 24px rgba(14,165,233,0.35)",
                }}
              >
                <Zap className="w-5 h-5" />
                Analyze My Performance
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--text-primary)",
              }}
            >
              <Play className="w-4 h-4" />
              Watch Demo
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              { value: "10K+", label: "Athletes" },
              { value: "500K+", label: "Videos Analyzed" },
              { value: "98%", label: "Accuracy" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mock analysis card floating */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="relative z-10 mt-20 max-w-4xl w-full mx-auto rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.1)",
          }}
        >
          {/* Fake browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <div className="flex-1 mx-4">
              <div className="h-5 max-w-xs rounded-md" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0">
            {/* Skeleton panel */}
            <div className="col-span-1 p-4" style={{ borderRight: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold mb-3" style={{ color: "#38bdf8" }}>POSE ANALYSIS</div>
              <svg viewBox="0 0 200 280" className="w-full opacity-80">
                {/* Simplified skeleton */}
                <g stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="100" y1="40" x2="100" y2="20" />
                  <line x1="80" y1="70" x2="120" y2="70" />
                  <line x1="80" y1="70" x2="65" y2="110" />
                  <line x1="65" y1="110" x2="55" y2="145" />
                  <line x1="120" y1="70" x2="135" y2="110" />
                  <line x1="135" y1="110" x2="145" y2="145" />
                  <line x1="80" y1="70" x2="85" y2="130" />
                  <line x1="120" y1="70" x2="115" y2="130" />
                  <line x1="85" y1="130" x2="115" y2="130" />
                  <line x1="85" y1="130" x2="83" y2="195" />
                  <line x1="115" y1="130" x2="117" y2="195" />
                  <line x1="83" y1="195" x2="82" y2="255" />
                  <line x1="117" y1="195" x2="118" y2="255" />
                  <line x1="82" y1="195" x2="92" y2="195" style={{ stroke: "#ef4444", strokeWidth: 3 }} />
                </g>
                {[
                  [100, 20], [80, 70], [120, 70], [65, 110], [135, 110],
                  [55, 145], [145, 145], [85, 130], [115, 130],
                  [83, 195], [117, 195], [82, 255], [118, 255]
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={3.5} fill="var(--surface)" stroke="#0ea5e9" strokeWidth={1.5}
                    style={{ filter: "drop-shadow(0 0 3px #0ea5e9)" }}
                  />
                ))}
                <circle cx={82} cy={195} r={6} fill="#ef444420" stroke="#ef4444" strokeWidth={1} />
                <circle cx={82} cy={195} r={4} fill="var(--surface)" stroke="#ef4444" strokeWidth={2}
                  style={{ filter: "drop-shadow(0 0 4px #ef4444)" }}
                />
                <circle cx={100} cy={20} r={10} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
              </svg>
            </div>
            {/* Scores panel */}
            <div className="col-span-2 p-4">
              <div className="text-xs font-semibold mb-3" style={{ color: "#38bdf8" }}>PERFORMANCE SCORES</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Overall", score: 78, color: "#0ea5e9" },
                  { label: "Technique", score: 72, color: "#8b5cf6" },
                  { label: "Power", score: 91, color: "#22c55e" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.score}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { label: "Hip Extension", score: 72, color: "#eab308" },
                  { label: "Bar Path", score: 94, color: "#22c55e" },
                  { label: "Lumbar Angle", score: 58, color: "#ef4444" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                      <span style={{ color: m.color }}>{m.score}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${m.score}%`, background: `linear-gradient(90deg, ${m.color}80, ${m.color})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <div className="text-xs font-semibold" style={{ color: "#fb923c" }}>⚠ Injury Risk Detected</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Lumbar flexion 18° under load · Reduce weight, focus on bracing
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#0ea5e9" }}>
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Everything an elite coach sees.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              AthleteAI analyzes the same details a world-class coach would review — then explains it in plain language and gives you specific drills to fix it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-hover p-6 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS SUPPORTED ── */}
      <section className="py-16 px-6" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
              Supports Every Sport
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Fencing", "Weightlifting", "Basketball", "Volleyball", "Golf", "Tennis", "Baseball", "Soccer", "Swimming", "Running", "Gymnastics", "Cycling", "Boxing", "CrossFit"].map((sport) => (
              <div
                key={sport}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {sport}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#0ea5e9" }}>
              Athletes Love It
            </div>
            <h2 className="text-4xl font-black tracking-tight">Real results from real athletes.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl relative"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex gap-1 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)", color: "white" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.sport}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xl font-black" style={{ color: "#0ea5e9" }}>{t.score}</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>score</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#0ea5e9" }}>
              Pricing
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">Invest in your performance.</h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Less than one coaching session. Available 24/7. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl flex flex-col"
                style={{
                  background: plan.highlighted ? "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.08))" : "var(--bg)",
                  border: plan.highlighted ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
                  boxShadow: plan.highlighted ? "0 0 40px rgba(14,165,233,0.15)" : "none",
                }}
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white" }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-1" style={{ color: plan.highlighted ? "#38bdf8" : "var(--text-secondary)" }}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>{plan.price}</span>
                    {plan.period && <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{plan.period}</span>}
                  </div>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{plan.description}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.highlighted ? "#0ea5e9" : "#22c55e" }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <button
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                    style={
                      plan.highlighted
                        ? { background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", boxShadow: "0 0 20px rgba(14,165,233,0.3)" }
                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }
                    }
                  >
                    {plan.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.1) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Ready to train like a pro?
          </h2>
          <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
            Upload your first video and get your performance analysis in under 60 seconds. No credit card required.
          </p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(14,165,233,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg"
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: "white",
                boxShadow: "0 0 30px rgba(14,165,233,0.35)",
              }}
            >
              <Zap className="w-5 h-5" />
              Start Analyzing Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-12 px-6"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">AthleteAI</span>
            <span className="text-sm ml-2" style={{ color: "var(--text-tertiary)" }}>© 2026</span>
          </div>
          <div className="flex gap-8 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {["Privacy", "Terms", "Contact", "Blog"].map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-white">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, Video, GitCompare, TrendingUp, MessageSquare, Plus } from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: LayoutGrid, label: "Home" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/compare", icon: GitCompare, label: "Compare" },
  { href: "/chat", icon: MessageSquare, label: "Coach" },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(6,10,16,0.92)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-safe pb-3">
        {/* First two tabs */}
        {TABS.slice(0, 2).map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className="flex flex-col items-center gap-1 py-1 relative">
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: "linear-gradient(90deg, #06b6d4, #22d3ee)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <tab.icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{ color: active ? "#06b6d4" : "#3d5a73", filter: active ? "drop-shadow(0 0 8px rgba(6,182,212,0.6))" : "none" }}
                />
                <span
                  className="text-xs font-medium transition-all duration-200"
                  style={{ color: active ? "#06b6d4" : "#3d5a73" }}
                >
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Center Analyze button */}
        <div className="flex-1 flex justify-center">
          <Link href="/analysis/an-001">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center -mt-5 relative"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                boxShadow: "0 0 24px rgba(6,182,212,0.5), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <Video className="w-6 h-6 text-white" />
            </motion.div>
          </Link>
        </div>

        {/* Last two tabs */}
        {TABS.slice(2).map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className="flex flex-col items-center gap-1 py-1 relative">
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: "linear-gradient(90deg, #06b6d4, #22d3ee)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <tab.icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{ color: active ? "#06b6d4" : "#3d5a73", filter: active ? "drop-shadow(0 0 8px rgba(6,182,212,0.6))" : "none" }}
                />
                <span
                  className="text-xs font-medium transition-all duration-200"
                  style={{ color: active ? "#06b6d4" : "#3d5a73" }}
                >
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  label?: string;
  fillOpacity?: number;
}

export function LineChart({
  data,
  color = "#0ea5e9",
  height = 100,
  showGrid = true,
  showDots = true,
  label,
  fillOpacity = 0.15,
}: LineChartProps) {
  const width = 400;
  const padX = 8;
  const padY = 8;

  const { points, minV, maxV, path, fillPath } = useMemo(() => {
    if (data.length === 0) return { points: [], minV: 0, maxV: 100, path: "", fillPath: "" };
    const values = data.map((d) => d.value);
    const minV = Math.min(...values) - 5;
    const maxV = Math.max(...values) + 5;
    const range = maxV - minV || 1;

    const points = data.map((d, i) => ({
      x: padX + (i / (data.length - 1)) * (width - padX * 2),
      y: padY + (1 - (d.value - minV) / range) * (height - padY * 2),
      value: d.value,
      date: d.date,
    }));

    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const fillPath =
      path +
      ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { points, minV, maxV, path, fillPath };
  }, [data, height]);

  return (
    <div>
      {label && (
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </p>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && [0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            y1={padY + t * (height - padY * 2)}
            x2={width - padX}
            y2={padY + t * (height - padY * 2)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill={`url(#fill-${color.replace("#", "")})`}
          />
        )}

        {/* Line */}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        )}

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke={color} strokeWidth={2} />
            </g>
          ))}
      </svg>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { OhlcvBar } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 200;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function PriceChart({ bars, name }: { bars: OhlcvBar[]; name: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, minPrice, maxPrice, color, periodReturn } = useMemo(() => {
    const closes = bars.map((b) => b.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const pts = bars.map((b, i) => {
      const x = PAD_LEFT + (i / Math.max(bars.length - 1, 1)) * innerW;
      const y =
        max === min
          ? PAD_TOP + innerH / 2
          : PAD_TOP + innerH - ((b.close - min) / (max - min)) * innerH;
      return { x, y, bar: b };
    });

    const ret = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;

    return {
      points: pts,
      minPrice: min,
      maxPrice: max,
      color: ret >= 0 ? "var(--accent)" : "var(--danger)",
      periodReturn: ret,
    };
  }, [bars]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT - PAD_BOTTOM} L${points[0].x},${HEIGHT - PAD_BOTTOM} Z`;

  function nearestIndexFromX(clientX: number, svgEl: SVGSVGElement) {
    const rect = svgEl.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < closestDist) {
        closestDist = d;
        closest = i;
      }
    });
    return closest;
  }

  const active = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div
      className="rounded-xl border border-border bg-surface p-4"
      role="img"
      aria-label={`${name} closing price over the last ${bars.length} sessions, ${periodReturn >= 0 ? "up" : "down"} ${Math.abs(periodReturn).toFixed(1)}%, ranging from ${minPrice.toFixed(2)} to ${maxPrice.toFixed(2)}`}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        tabIndex={0}
        onMouseMove={(e) => setHoverIndex(nearestIndexFromX(e.clientX, e.currentTarget))}
        onMouseLeave={() => setHoverIndex(null)}
        onFocus={() => setHoverIndex(points.length - 1)}
        onBlur={() => setHoverIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            setHoverIndex((i) => Math.max(0, (i ?? points.length - 1) - 1));
          } else if (e.key === "ArrowRight") {
            setHoverIndex((i) => Math.min(points.length - 1, (i ?? points.length - 1) + 1));
          }
        }}
      >
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--border)"
          strokeWidth={1}
        />

        <text x={4} y={PAD_TOP + 4} fontSize={10} fill="var(--muted)">
          {maxPrice.toFixed(0)}
        </text>
        <text x={4} y={HEIGHT - PAD_BOTTOM} fontSize={10} fill="var(--muted)">
          {minPrice.toFixed(0)}
        </text>

        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={active.x} cy={active.y} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />

        {hoverIndex !== null && (
          <line
            x1={active.x}
            y1={PAD_TOP}
            x2={active.x}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        <text x={PAD_LEFT} y={HEIGHT - 8} fontSize={10} fill="var(--muted)">
          {formatDate(points[0].bar.date)}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 8} fontSize={10} fill="var(--muted)" textAnchor="end">
          {formatDate(points[points.length - 1].bar.date)}
        </text>
      </svg>

      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted">{formatDate(active.bar.date)}</span>
        <span className="font-semibold tabular-nums">
          {active.bar.close.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

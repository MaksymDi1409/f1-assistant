"use client";

import { useEffect, useState } from "react";
import type { Replay, ReplayPoint } from "@/lib/f1/replay";

const SPEEDS = [1, 2, 5, 10];

// Позиція боліда в момент t: між двома замірами — лінійна інтерполяція
function positionAt(points: ReplayPoint[], t: number): [number, number] | null {
  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (t <= first[0]) return [first[1], first[2]];
  if (t >= last[0]) return [last[1], last[2]];

  // Бінарний пошук: два заміри, між якими лежить t
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= t) lo = mid;
    else hi = mid;
  }

  const [t0, x0, y0] = points[lo];
  const [t1, x1, y1] = points[hi];
  const k = (t - t0) / (t1 - t0);
  return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
}

type Props = {
  replay: Replay;
  initialSpeed?: number;
  initialShowLabels?: boolean;
};

export default function TrackReplay({
  replay,
  initialSpeed = 2,
  initialShowLabels = true,
}: Props) {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(initialSpeed);
  const [showLabels, setShowLabels] = useState(initialShowLabels);

  // Якщо адмін задав нестандартну швидкість (наприклад ×3), додаємо її до кнопок
  const speeds = SPEEDS.includes(initialSpeed)
    ? SPEEDS
    : [...SPEEDS, initialSpeed].sort((a, b) => a - b);
  
  // Цикл анімації: на кожному кадрі зсуваємо час на прожиті мілісекунди × швидкість
  useEffect(() => {
    if (!isPlaying) return;

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setTime((t) => (t + dt * speed) % replay.durationMs);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, speed, replay.durationMs]);

  return (
    <div className="rounded-xl border border-white/10 bg-surface p-4">
      <svg
        viewBox={`0 0 ${replay.width} ${replay.height}`}
        className="mx-auto max-h-[60vh] w-full"
        role="img"
        aria-label={`Повтор кола ${replay.lap}: ${replay.title}`}
      >
        <polyline
          points={replay.track.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={16}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {replay.drivers.map((d) => {
          const pos = positionAt(d.points, time);
          if (!pos) return null;

          return (
            <g key={d.number} transform={`translate(${pos[0]} ${pos[1]})`}>
              <circle r={10} fill={d.color} stroke="#0b0b0f" strokeWidth={2} />
              {showLabels && (
                <text
                  y={-16}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={600}
                  fill="#f2f2f5"
                >
                  {d.acronym}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-24 rounded-lg bg-accent px-3 py-1.5 font-medium text-white"
        >
          {isPlaying ? "Пауза" : "Старт"}
        </button>

        <div className="flex gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-md px-2.5 py-1.5 ${
                s === speed ? "bg-white/15 text-foreground" : "text-muted hover:bg-white/5"
              }`}
            >
              ×{s}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="accent-accent"
          />
          Підписи
        </label>

        <span className="ml-auto tabular-nums text-muted">
          {(time / 1000).toFixed(1)} / {(replay.durationMs / 1000).toFixed(1)} с
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={replay.durationMs}
        value={time}
        onChange={(e) => setTime(Number(e.target.value))}
        className="mt-3 w-full accent-accent"
        aria-label="Перемотування"
      />
    </div>
  );
}
import { getCircuitOutline } from "@/lib/f1/track";
import type { Race } from "@/lib/f1/types";
import { fmt } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

// Серверний компонент: схема рахується на сервері, браузер отримує готовий SVG без JavaScript
export default async function TrackMap({ race }: { race: Race }) {
  const [outline, dict] = await Promise.all([getCircuitOutline(race), getDictionary()]);
  const t = dict.race;

  if (!outline) {
    return <p className="text-sm text-muted">{t.trackUnavailable}</p>;
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${outline.width} ${outline.height}`}
        role="img"
        aria-label={fmt(t.trackAria, { circuit: race.Circuit.circuitName })}
        className="mx-auto max-h-72 w-full"
      >
        {/* Широка підкладка + тонка лінія поверх: виглядає як дорога */}
        <path
          d={outline.path}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={22}
          strokeLinejoin="round"
        />
        <path
          d={outline.path}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinejoin="round"
          className="text-foreground"
        />
        <circle
          cx={outline.start[0]}
          cy={outline.start[1]}
          r={16}
          className="fill-accent"
        />
      </svg>
      <figcaption className="mt-2 text-xs text-muted">
        {fmt(t.trackSource, { year: outline.year })}
      </figcaption>
    </figure>
  );
}

export function TrackMapSkeleton() {
  return <div className="h-48 animate-pulse rounded-lg bg-subtle" />;
}

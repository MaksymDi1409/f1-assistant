import { Suspense } from "react";
import Link from "next/link";
import TrackReplay from "@/components/TrackReplay";
import { buildReplay, getLatestRaceSession } from "@/lib/f1/replay";

// Згодом це налаштовуватиме адмін у CMS
const REPLAY_LAP = 5;

async function loadReplay() {
  try {
    const session = await getLatestRaceSession();
    return session ? await buildReplay(session, REPLAY_LAP) : null;
  } catch (error) {
    // Очікуваний збій: головна працює далі, просто без повтору
    console.warn("Replay unavailable:", error);
    return null;
  }
}

// Окремий асинхронний компонент: лише він чекає на OpenF1
async function HomeReplay() {
  const replay = await loadReplay();

  if (!replay) {
    return (
      <p className="rounded-xl border border-white/10 bg-surface p-6 text-sm text-muted">
        Повтор зараз недоступний: дані OpenF1 тимчасово не завантажились. Спробуй
        пізніше.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted">
        {replay.title} · коло {replay.lap}
      </p>
      <TrackReplay replay={replay} />
    </>
  );
}

function ReplaySkeleton() {
  return (
    <div className="flex h-80 animate-pulse items-center justify-center rounded-xl border border-white/10 bg-surface text-sm text-muted">
      Завантажую повтор кола…
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="py-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          F1 <span className="text-accent">Assistant</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Календар, таблиці, пілоти та AI-помічник для фанатів Формули 1
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent/90"
          >
            Запитати AI
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-white/15 px-5 py-2.5 font-medium hover:bg-white/5"
          >
            Календар
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold">Повтор кола</h2>
        <Suspense fallback={<ReplaySkeleton />}>
          <HomeReplay />
        </Suspense>
      </section>
    </>
  );
}
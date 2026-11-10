import { Suspense } from "react";
import Link from "next/link";
import TrackReplay from "@/components/TrackReplay";
import { getSiteSettings, type SiteSettings } from "@/lib/cms/settings";
import { buildReplay, getLatestRaceSession } from "@/lib/f1/replay";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

async function loadReplay(lap: number) {
  try {
    const session = await getLatestRaceSession();
    return session ? await buildReplay(session, lap) : null;
  } catch (error) {
    // Очікуваний збій: головна працює далі, просто без повтору
    console.warn("Replay unavailable:", error);
    return null;
  }
}

// Окремий асинхронний компонент: лише він чекає на OpenF1
async function HomeReplay({ settings, t }: { settings: SiteSettings; t: Dictionary }) {
  const replay = await loadReplay(settings.replay_lap);

  if (!replay) {
    return (
      <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        {t.home.replayUnavailable}
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted">
        {fmt(t.home.replayCaption, { title: replay.title, lap: replay.lap })}
      </p>
      <TrackReplay replay={replay} initialShowLabels={settings.replay_show_labels} />
    </>
  );
}

function ReplaySkeleton({ text }: { text: string }) {
  return (
    <div className="flex h-80 animate-pulse items-center justify-center rounded-xl border border-line bg-surface text-sm text-muted">
      {text}
    </div>
  );
}

export default async function HomePage() {
  const [settings, { locale, t: dict }] = await Promise.all([getSiteSettings(), getI18n()]);

  // Останнє слово заголовка виділяємо червоним: "F1 Assistant" → "F1 <Assistant>"
  const words = settings.hero_title.split(" ");
  const lastWord = words.pop();

  return (
    <>
      <section className="py-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          {words.join(" ")} <span className="text-accent">{lastWord}</span>
        </h1>
        {/* Підзаголовок з CMS написаний українською; для англійської беремо словник */}
        <p className="mt-4 text-lg text-muted">
          {locale === "uk" ? settings.hero_subtitle : dict.home.subtitle}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent/90"
          >
            {dict.home.askAi}
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-line-strong px-5 py-2.5 font-medium hover:bg-subtle"
          >
            {dict.home.calendar}
          </Link>
        </div>
      </section>

      {settings.replay_enabled && (
        <section>
          <h2 className="mb-1 text-xl font-semibold">{dict.home.replayTitle}</h2>
          <Suspense fallback={<ReplaySkeleton text={dict.home.replayLoading} />}>
            <HomeReplay settings={settings} t={dict} />
          </Suspense>
        </section>
      )}
    </>
  );
}
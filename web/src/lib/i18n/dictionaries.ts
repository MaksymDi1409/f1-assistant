import type { Locale } from "./config";

// Тексти інтерфейсу. Контент (статті) перекладається окремо — через ШІ і зберігається в CMS
const uk = {
  nav: {
    home: "Головна",
    chat: "AI-помічник",
    calendar: "Календар",
    standings: "Таблиця",
    drivers: "Пілоти",
    teams: "Команди",
    news: "Новини",
    admin: "Адмін",
    login: "Увійти",
    account: "Кабінет",
  },
  home: {
    subtitle: "Календар, таблиці, пілоти та AI-помічник для фанатів Формули 1",
    askAi: "Запитати AI",
    calendar: "Календар",
    replayTitle: "Повтор кола",
  },
  pages: {
    chatTitle: "AI-помічник",
    chatDescription: "Запитай будь-що про Формулу 1",
    calendarTitle: "Календар",
    calendarDescription: (season: string, count: number) => `Сезон ${season} · ${count} етапів`,
    standingsTitle: "Таблиця",
    standingsDescription: "Особистий і командний залік поточного сезону",
    driversTitle: "Пілоти",
    driversDescription: "Усі пілоти поточного сезону",
    teamsTitle: "Команди",
    teamsDescription: "Команди та їхні пілоти",
  },
  news: {
    title: "Новини",
    titleWithCategory: (name: string) => `Новини: ${name}`,
    description: "Статті та новини",
    all: "Усі",
    unavailable: "Новини тимчасово недоступні.",
    empty: "Поки що немає жодної статті.",
    emptyCategory: "У цій категорії поки немає статей.",
    back: "← Новини",
    author: "Автор",
    machineTranslated: "",
    notTranslated: "",
    translate: "🌐 Перекласти англійською (AI)",
    retranslate: "🌐 Оновити переклад (AI)",
    translating: "Перекладаю…",
    translated: "Переклад збережено",
  },
};

export type Dictionary = typeof uk;

const en: Dictionary = {
  nav: {
    home: "Home",
    chat: "AI assistant",
    calendar: "Calendar",
    standings: "Standings",
    drivers: "Drivers",
    teams: "Teams",
    news: "News",
    admin: "Admin",
    login: "Log in",
    account: "Account",
  },
  home: {
    subtitle: "Calendar, standings, drivers and an AI assistant for Formula 1 fans",
    askAi: "Ask AI",
    calendar: "Calendar",
    replayTitle: "Lap replay",
  },
  pages: {
    chatTitle: "AI assistant",
    chatDescription: "Ask anything about Formula 1",
    calendarTitle: "Calendar",
    calendarDescription: (season: string, count: number) => `Season ${season} · ${count} rounds`,
    standingsTitle: "Standings",
    standingsDescription: "Drivers' and constructors' championships of the current season",
    driversTitle: "Drivers",
    driversDescription: "All drivers of the current season",
    teamsTitle: "Teams",
    teamsDescription: "Teams and their drivers",
  },
  news: {
    title: "News",
    titleWithCategory: (name: string) => `News: ${name}`,
    description: "Articles and news",
    all: "All",
    unavailable: "News is temporarily unavailable.",
    empty: "No articles yet.",
    emptyCategory: "No articles in this category yet.",
    back: "← News",
    author: "Author",
    machineTranslated: "Translated from Ukrainian by AI",
    notTranslated: "This article has not been translated yet, showing the original in Ukrainian.",
    translate: "🌐 Translate to English (AI)",
    retranslate: "🌐 Update translation (AI)",
    translating: "Translating…",
    translated: "Translation saved",
  },
};

const dictionaries: Record<Locale, Dictionary> = { uk, en };

export function getDictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

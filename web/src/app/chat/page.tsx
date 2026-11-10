import type { Metadata } from "next";
import { headers } from "next/headers";
import PageHeader from "@/components/PageHeader";
import Chat from "@/components/chat/Chat";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientKey, getDailyLimit, peekChatLimit } from "@/lib/chat-limit";
import { getSiteSettings } from "@/lib/cms/settings";
import { getDictionary, getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.chat };
}

export default async function ChatPage() {
  const [settings, user, requestHeaders, { locale, t: dict }] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    headers(),
    getI18n(),
  ]);

  // Скільки питань лишилось на сьогодні (без витрачання)
  const { limit, remaining } = peekChatLimit(
    getClientKey(user, requestHeaders),
    getDailyLimit(user, settings),
  );

  return (
    <>
      <PageHeader
        title={dict.pages.chatTitle}
        description={dict.pages.chatDescription}
      />
      <Chat
        // Швидкі питання з CMS написані українською; для англійської беремо словник
        quickQuestions={locale === "uk" ? settings.chat_quick_questions : dict.chat.quickQuestions}
        limit={limit}
        initialRemaining={remaining}
        isGuest={!user}
      />
    </>
  );
}
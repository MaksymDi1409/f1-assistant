import type { Metadata } from "next";
import { headers } from "next/headers";
import PageHeader from "@/components/PageHeader";
import Chat from "@/components/chat/Chat";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientKey, getDailyLimit, peekChatLimit } from "@/lib/chat-limit";
import { getSiteSettings } from "@/lib/cms/settings";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "AI-помічник" };

export default async function ChatPage() {
  const [settings, user, requestHeaders, dict] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    headers(),
    getDictionary(),
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
        quickQuestions={settings.chat_quick_questions}
        limit={limit}
        initialRemaining={remaining}
        isGuest={!user}
      />
    </>
  );
}
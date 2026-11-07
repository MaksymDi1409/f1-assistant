import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Chat from "@/components/chat/Chat";
import { getSiteSettings } from "@/lib/cms/settings";

export const metadata: Metadata = { title: "AI-помічник" };

export default async function ChatPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        title="AI-помічник"
        description="Запитай будь-що про Формулу 1"
      />
      <Chat quickQuestions={settings.chat_quick_questions} />
    </>
  );
}
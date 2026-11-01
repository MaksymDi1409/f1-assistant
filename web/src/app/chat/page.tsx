import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "AI-помічник" };

export default function ChatPage() {
  return (
    <PageHeader
      title="AI-помічник"
      description="Запитай будь-що про Формулу 1"
    />
  );
}
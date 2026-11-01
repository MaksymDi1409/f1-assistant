import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ChatPage from "../chat/page";

export const metadata: Metadata = { title: "Календар	" };

export default function CalendarPage() {
  return (
    <PageHeader
      title="Календар	"
      description="Розклад етапів сезону"
    />
  );
}
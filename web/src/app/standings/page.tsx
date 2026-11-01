import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Таблиця" };

export default function StandingsPage() {
  return (
    <PageHeader
      title="Таблиця"
      description="Особистий і командний залік"
    />
  );
}
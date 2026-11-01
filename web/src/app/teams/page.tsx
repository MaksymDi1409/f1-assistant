import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Команди" };

export default function TeamsPage() {
  return (
    <PageHeader
      title="Команди"
      description="Команди та їхні пілоти"
    />
  );
}
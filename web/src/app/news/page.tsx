import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Новини" };

export default function NewsPage() {
  return (
    <PageHeader
      title="Новини"
      description="Статті та новини"
    />
  );
}
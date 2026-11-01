import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Пілоти" };

export default function DriversPage() {
  return (
    <PageHeader
      title="Пілоти"
      description="Усі пілоти поточного сезону"
    />
  );
}
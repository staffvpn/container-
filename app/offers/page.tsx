import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Предложения — Грядка",
};

export default function OffersPage() {
  return <StubPage title="Предложения" />;
}

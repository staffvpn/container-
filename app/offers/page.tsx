import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Предложения — Контейнер",
};

export default function OffersPage() {
  return <StubPage title="Предложения" />;
}

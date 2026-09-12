import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Карта — Контейнер",
};

export default function MapPage() {
  return <StubPage title="Карта" />;
}

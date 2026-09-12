import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Профиль — Контейнер",
};

export default function ProfilePage() {
  return <StubPage title="Профиль" />;
}

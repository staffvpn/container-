import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Профиль — Грядка",
};

export default function ProfilePage() {
  return <StubPage title="Профиль" />;
}

"use client";

import dynamic from "next/dynamic";
import type { SupplierMapPoint } from "@/lib/data/types";

const SupplierMap = dynamic(() => import("./supplier-map").then((m) => m.SupplierMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--color-ink-soft)]">
      Загрузка карты…
    </div>
  ),
});

export function SupplierMapLoader(props: {
  points: SupplierMapPoint[];
  focusCenter: [number, number] | null;
}) {
  return <SupplierMap {...props} />;
}

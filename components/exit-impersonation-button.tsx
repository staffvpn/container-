"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { exitImpersonation } from "@/app/my-suppliers/[id]/impersonation-actions";

export function ExitImpersonationButton({ supplierId }: { supplierId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await exitImpersonation(supplierId);
          router.push("/admin/suppliers");
          router.refresh();
        });
      }}
      className="shrink-0 rounded-full border border-[var(--color-ink)] px-4 py-1.5 font-medium hover:bg-white"
    >
      {pending ? "Выход..." : "Выйти из режима управления"}
    </button>
  );
}

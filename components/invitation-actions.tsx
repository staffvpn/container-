"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation, declineInvitation } from "@/app/invitations/actions";

export function InvitationActions({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось выполнить действие.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => acceptInvitation(invitationId))}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Принять
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => declineInvitation(invitationId))}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}

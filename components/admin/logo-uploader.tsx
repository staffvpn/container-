"use client";

import { useActionState } from "react";
import { uploadSupplierLogo, type LogoUploadState } from "@/app/admin/suppliers/[id]/logo-actions";

export function LogoUploader({ supplierId, currentUrl }: { supplierId: string; currentUrl?: string | null }) {
  const boundUpload = uploadSupplierLogo.bind(null, supplierId);
  const [state, formAction, pending] = useActionState<LogoUploadState, FormData>(boundUpload, {});
  const previewUrl = state.url ?? currentUrl ?? null;

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
      <p className="text-sm font-medium">Логотип / фото компании</p>
      {state.error && <p className="text-sm text-[#b3261e]">{state.error}</p>}
      <div className="flex items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-[var(--radius-sm)] object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-panel)] text-xs text-[var(--color-ink-soft)]">
            Нет фото
          </div>
        )}
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {pending ? "Загрузка..." : "Загрузить"}
        </button>
      </div>
      <p className="text-xs text-[var(--color-ink-soft)]">PNG, JPEG, WEBP или GIF, до 5 МБ.</p>
    </form>
  );
}

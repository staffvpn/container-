"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export function PromoCodeButton({
  code,
  promoCodeId,
  supplierId,
}: {
  code: string;
  promoCodeId?: string;
  supplierId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    trackEvent({ eventType: "copy_promo", promoCodeId, supplierId });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full border border-dashed border-[var(--color-ink)] px-4 py-2 text-sm font-medium"
    >
      <span className="tracking-wide">{code}</span>
      <span className="text-[var(--color-ink-soft)]">{copied ? "Скопировано" : "Скопировать"}</span>
    </button>
  );
}

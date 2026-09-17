"use client";

import { trackEvent } from "@/lib/analytics/track-event";

export function TrackedLink({
  href,
  eventType,
  children,
  className,
  supplierId,
}: {
  href: string;
  eventType: "click_website" | "click_telegram" | "click_phone";
  children: React.ReactNode;
  className?: string;
  supplierId?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => trackEvent({ eventType, supplierId })}
      className={className}
      target={eventType === "click_phone" ? undefined : "_blank"}
      rel={eventType === "click_phone" ? undefined : "noopener noreferrer"}
    >
      {children}
    </a>
  );
}

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const eventTypes = [
  "search", "view_supplier", "view_category", "view_offer",
  "click_website", "click_telegram", "click_phone", "copy_promo",
] as const;

type EventType = (typeof eventTypes)[number];

export function trackEvent(input: {
  eventType: EventType;
  queryText?: string;
  sourcePage?: string;
}): void {
  const supabase = createBrowserSupabaseClient();
  void supabase
    .from("analytics_events")
    .insert({
      event_type: input.eventType,
      query_text: input.queryText ?? null,
      source_page: input.sourcePage ?? null,
    })
    .then(() => {});
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");
  const supplierSlug = request.nextUrl.searchParams.get("supplier");

  if (!to) {
    return NextResponse.json({ error: "missing to" }, { status: 400 });
  }

  if (supplierSlug) {
    const supabase = createSupabasePublicClient();
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("slug", supplierSlug)
      .maybeSingle();

    if (supplier) {
      await supabase.from("analytics_events").insert({
        event_type: "click_website",
        supplier_id: supplier.id,
        source_page: request.nextUrl.searchParams.get("source") ?? "supplier_page",
      });
    }
  }

  return NextResponse.redirect(to);
}

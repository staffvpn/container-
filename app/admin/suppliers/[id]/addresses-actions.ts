"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/admin/geocode";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("not an admin");

  return { supabase, userId: user.id };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  supplierId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: "admin",
    entity_type: "supplier_address",
    entity_id: supplierId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export type AddressFormState = { error?: string; warning?: string };

export async function addAddress(
  supplierId: string,
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const { supabase, userId } = await requireAdmin();

  const address = String(formData.get("address") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  const cityId = String(formData.get("city_id") ?? "") || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const postalCode = String(formData.get("postal_code") ?? "").trim() || null;
  const workingHours = String(formData.get("working_hours") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const pickupAvailable = formData.get("pickup_available") === "on";
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const isPrimary = formData.get("is_primary") === "on";
  const manualLat = formData.get("manual_lat") ? Number(formData.get("manual_lat")) : null;
  const manualLng = formData.get("manual_lng") ? Number(formData.get("manual_lng")) : null;

  if (!address) {
    return { error: "Укажите адрес." };
  }

  let lat: number | null = manualLat;
  let lng: number | null = manualLng;
  let geocodingStatus: "success" | "failed" | "manual";

  if (manualLat !== null && manualLng !== null) {
    geocodingStatus = "manual";
  } else {
    const result = await geocodeAddress(address);
    if (result) {
      lat = result.lat;
      lng = result.lng;
      geocodingStatus = "success";
    } else {
      geocodingStatus = "failed";
    }
  }

  if (lat === null || lng === null) {
    // Store the address without coordinates so the admin can supply them
    // manually — per spec, a failed geocode must not silently place a
    // marker, but the address record itself is still saved.
    const { error } = await supabase.from("supplier_addresses").insert({
      supplier_id: supplierId,
      address,
      label,
      city_id: cityId,
      region,
      postal_code: postalCode,
      working_hours: workingHours,
      phone,
      pickup_available: pickupAvailable,
      comment,
      is_primary: isPrimary,
      lat: 0,
      lng: 0,
      geocoding_status: "failed",
    });
    if (error) {
      return { error: error.message.includes("duplicate") || error.message.includes("unique")
        ? "Такой адрес уже есть у этого поставщика."
        : `Не удалось сохранить: ${error.message}` };
    }
    revalidatePath(`/admin/suppliers/${supplierId}`);
    return { warning: "Не удалось определить координаты автоматически. Адрес сохранён — укажите координаты вручную." };
  }

  const { error } = await supabase.from("supplier_addresses").insert({
    supplier_id: supplierId,
    address,
    label,
    city_id: cityId,
    region,
    postal_code: postalCode,
    working_hours: workingHours,
    phone,
    pickup_available: pickupAvailable,
    comment,
    is_primary: isPrimary,
    lat,
    lng,
    geocoding_status: geocodingStatus,
  });

  if (error) {
    return { error: error.message.includes("duplicate") || error.message.includes("unique")
      ? "Такой адрес уже есть у этого поставщика."
      : `Не удалось сохранить: ${error.message}` };
  }

  await logAudit(supabase, userId, supplierId, "address_added", null, { address, lat, lng });
  revalidatePath(`/admin/suppliers/${supplierId}`);
  return {};
}

export async function deleteAddress(supplierId: string, addressId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("supplier_addresses").delete().eq("id", addressId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, supplierId, "address_deleted", { id: addressId }, null);
  revalidatePath(`/admin/suppliers/${supplierId}`);
}

export async function setPrimaryAddress(supplierId: string, addressId: string) {
  const { supabase, userId } = await requireAdmin();

  await supabase.from("supplier_addresses").update({ is_primary: false }).eq("supplier_id", supplierId);
  const { error } = await supabase.from("supplier_addresses").update({ is_primary: true }).eq("id", addressId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, supplierId, "address_set_primary", null, { id: addressId });
  revalidatePath(`/admin/suppliers/${supplierId}`);
}

export async function setManualCoordinates(supplierId: string, addressId: string, lat: number, lng: number) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("supplier_addresses")
    .update({ lat, lng, geocoding_status: "manual" })
    .eq("id", addressId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, supplierId, "address_coordinates_set", null, { id: addressId, lat, lng });
  revalidatePath(`/admin/suppliers/${supplierId}`);
}

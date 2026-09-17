/**
 * supabase-js can't tell a to-one embedded relation from a to-many one without generated
 * Database types, so it always types embeds as an array even when a single FK guarantees at
 * most one row. Runtime always returns a single object (or null) for these; this just narrows
 * the type to match reality instead of fighting the inferred array type at every call site.
 */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

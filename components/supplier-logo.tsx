const palette = ["#B5451F", "#2F5D50", "#3B4B6B", "#7A5C3E", "#5B6168"];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function SupplierLogo({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-semibold text-white"
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials}
    </div>
  );
}

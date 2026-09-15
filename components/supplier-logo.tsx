const palette = ["#2C3E67", "#2F5D50", "#5B3A5C", "#7A5C3E", "#5C6169"];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const sizeClasses = {
  sm: "h-12 w-12 rounded-[var(--radius-sm)] text-sm",
  lg: "h-20 w-20 rounded-full text-2xl",
  fill: "h-full w-full rounded-[var(--radius-sm)] text-3xl",
};

export function SupplierLogo({ name, size = "sm" }: { name: string; size?: "sm" | "lg" | "fill" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials}
    </div>
  );
}

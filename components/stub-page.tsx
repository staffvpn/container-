export function StubPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-[var(--color-ink-soft)]">Раздел в разработке.</p>
    </main>
  );
}

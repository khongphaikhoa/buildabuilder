export function GlassNav({ children }: { children: React.ReactNode }) {
  return (
    <header className="nav-glass">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        {children}
      </div>
    </header>
  );
}

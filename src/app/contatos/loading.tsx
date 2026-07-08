export default function ContatosLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 rounded-lg border border-hairline bg-surface/50" />
      <div className="h-9 w-full max-w-xl rounded-lg bg-surface" />
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-hairline bg-card p-3">
            <div className="h-4 w-20 rounded bg-surface" />
            <div className="h-16 rounded bg-surface/80" />
            <div className="h-16 rounded bg-surface/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils"

export function CardPendente({
  className,
  linhas = 2,
}: {
  className?: string
  linhas?: number
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-muted/50 p-6",
        className
      )}
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />
      <div className="space-y-3">
        <div className="h-10 w-10 rounded-2xl bg-muted-foreground/15" />
        {Array.from({ length: linhas }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded-lg bg-muted-foreground/15",
              i === 0 ? "w-3/4" : "w-1/2"
            )}
          />
        ))}
      </div>
    </div>
  )
}

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ModuloConteudo = dynamic(
  () =>
    import("@/componentes/modulos/modulo-conteudo").then((m) => ({
      default: m.ModuloConteudo,
    })),
  {
    loading: () => (
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    ),
  }
)

export default function ConteudoPage() {
  return <ModuloConteudo />
}

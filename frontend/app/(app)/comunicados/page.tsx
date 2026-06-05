import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ModuloComunicados = dynamic(
  () =>
    import("@/componentes/modulos/modulo-comunicados").then((m) => ({
      default: m.ModuloComunicados,
    })),
  {
    loading: () => (
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    ),
  }
)

export default function ComunicadosPage() {
  return <ModuloComunicados />
}

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ModuloDashboard = dynamic(
  () =>
    import("@/componentes/modulos/modulo-dashboard").then((m) => ({
      default: m.ModuloDashboard,
    })),
  {
    loading: () => (
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    ),
  }
)

export default function DashboardPage() {
  return <ModuloDashboard />
}

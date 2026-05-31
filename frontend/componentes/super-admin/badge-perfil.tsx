import { Badge } from "@/components/ui/badge"
import type { TipoPerfilUsuario } from "@/lib/api/dtos/configuracoes"
import { cn } from "@/lib/utils"
import { COR_PERFIL, LABEL_PERFIL } from "./utils"

export function BadgePerfil({ perfil }: { perfil: TipoPerfilUsuario }) {
  return (
    <Badge variant="secondary" className={cn("rounded-full font-medium", COR_PERFIL[perfil])}>
      {LABEL_PERFIL[perfil]}
    </Badge>
  )
}

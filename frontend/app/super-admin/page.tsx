"use client"

import * as React from "react"
import { Building2, UserPlus } from "lucide-react"
import { CartoesKpiPlataforma } from "@/componentes/super-admin/cartoes-kpi-plataforma"
import {
  FiltrosDiretorio,
  type FiltrosDiretorioState,
} from "@/componentes/super-admin/filtros-diretorio"
import { VISAO_OPCOES_HOME } from "@/componentes/super-admin/utils"
import { ModalCriarInstituicao } from "@/componentes/super-admin/modal-criar-instituicao"
import { ModalCriarSuperAdminWizard } from "@/componentes/super-admin/modal-criar-super-admin-wizard"
import { TabelaDiretorioPlataforma } from "@/componentes/super-admin/tabela-diretorio-plataforma"
import { Button } from "@/components/ui/button"

export default function SuperAdminHomePage() {
  const [modalInst, setModalInst] = React.useState(false)
  const [modalUsuario, setModalUsuario] = React.useState(false)
  const [filtros, setFiltros] = React.useState<FiltrosDiretorioState>({
    visao: "instituicoes",
    instituicaoId: "",
    turmaIds: [],
    perfil: "",
    busca: "",
  })

  return (
    <div className="space-y-8">
      <CartoesKpiPlataforma />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-lg font-semibold text-muted-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Explorar plataforma
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => setModalInst(true)}
            >
              <Building2 className="h-4 w-4" />
              Nova instituição
            </Button>
            <Button
              className="rounded-xl gap-2 bg-gradient-to-br from-primary to-primary/80 shadow-soft"
              onClick={() => setModalUsuario(true)}
            >
              <UserPlus className="h-4 w-4" />
              Novo super admin
            </Button>
          </div>
        </div>

        <FiltrosDiretorio
          filtros={filtros}
          onChange={setFiltros}
          visoesDisponiveis={VISAO_OPCOES_HOME}
        />
        <TabelaDiretorioPlataforma filtros={filtros} />
      </div>

      <ModalCriarInstituicao aberto={modalInst} onOpenChange={setModalInst} />
      <ModalCriarSuperAdminWizard aberto={modalUsuario} onOpenChange={setModalUsuario} />
    </div>
  )
}

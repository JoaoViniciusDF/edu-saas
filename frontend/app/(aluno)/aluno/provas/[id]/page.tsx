import { ResolverProva } from "@/componentes/modulos/resolver-prova"

export default async function AlunoProvaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ResolverProva avaliacaoId={id} />
}

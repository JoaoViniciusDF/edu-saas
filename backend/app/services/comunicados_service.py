from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.exceptions import bad_request, forbidden, not_found
from app.models.comunicados import (
    Comunicado,
    ComunicadoDestinatario,
    ComunicadoDestinatarioEfetivo,
    ComunicadoImagem,
    ComunicadoLeitura,
)
from app.models.enums import (
    SituacaoMatricula,
    StatusComunicado,
    TipoDestinatarioComunicado,
    TipoPerfil,
)
from app.models.governanca import Aluno, AlunoResponsavel, Matricula, Professor, Responsavel, UsuarioConta
from app.schemas.comunicados import (
    ComunicadoCreate,
    ComunicadoDetail,
    ComunicadoLeituraItem,
    ComunicadoLeiturasResponse,
    ComunicadoListItem,
    ComunicadoPatch,
    DestinatarioRef,
)


class ComunicadosService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _inst_id(self, user: CurrentUser) -> uuid.UUID:
        if not user.instituicao_id:
            raise forbidden()
        return user.instituicao_id

    def _comunicado_tenant(self, cid: uuid.UUID, inst_id: uuid.UUID) -> Comunicado:
        c = self.db.get(Comunicado, cid)
        if not c or c.instituicao_id != inst_id:
            raise not_found()
        return c

    def _validate_create(self, body: ComunicadoCreate) -> None:
        if not body.titulo.strip():
            raise bad_request("Título obrigatório")
        if not body.corpo.strip() and not body.imagens_urls:
            raise bad_request("Corpo ou imagens obrigatórios")
        if not body.destinatarios:
            raise bad_request("Ao menos um destinatário")

    def list_comunicados(self, user: CurrentUser, limit: int = 50) -> list[ComunicadoListItem]:
        inst_id = self._inst_id(user)
        leitura_join = and_(
            ComunicadoLeitura.comunicado_id == Comunicado.id,
            ComunicadoLeitura.usuario_id == user.id,
        )
        if user.perfil in (TipoPerfil.professor, TipoPerfil.administrador):
            stmt = (
                select(Comunicado, ComunicadoLeitura.id.isnot(None).label("lido"))
                .outerjoin(ComunicadoLeitura, leitura_join)
                .where(Comunicado.instituicao_id == inst_id)
                .order_by(Comunicado.criado_em.desc())
                .limit(limit)
            )
        else:
            stmt = (
                select(Comunicado, ComunicadoLeitura.id.isnot(None).label("lido"))
                .join(
                    ComunicadoDestinatarioEfetivo,
                    ComunicadoDestinatarioEfetivo.comunicado_id == Comunicado.id,
                )
                .outerjoin(ComunicadoLeitura, leitura_join)
                .where(
                    Comunicado.instituicao_id == inst_id,
                    Comunicado.status == StatusComunicado.publicado,
                    ComunicadoDestinatarioEfetivo.usuario_id == user.id,
                )
                .order_by(Comunicado.criado_em.desc())
                .limit(limit)
            )
        rows = self.db.execute(stmt).all()
        return [
            ComunicadoListItem(
                id=c.id,
                titulo=c.titulo,
                status=c.status,
                publicado_em=c.publicado_em,
                lido=bool(lido),
                preview_corpo=(c.corpo or "")[:120],
            )
            for c, lido in rows
        ]

    def get_comunicado(self, user: CurrentUser, cid: uuid.UUID) -> ComunicadoDetail:
        inst_id = self._inst_id(user)
        c = self._comunicado_tenant(cid, inst_id)
        if user.perfil not in (TipoPerfil.professor, TipoPerfil.administrador):
            ef = self.db.scalar(
                select(ComunicadoDestinatarioEfetivo).where(
                    ComunicadoDestinatarioEfetivo.comunicado_id == cid,
                    ComunicadoDestinatarioEfetivo.usuario_id == user.id,
                )
            )
            if not ef or c.status != StatusComunicado.publicado:
                raise not_found()
        incluir = user.perfil in (TipoPerfil.professor, TipoPerfil.administrador)
        return self._detail(c, user.id, incluir_contagem=incluir)

    def _emissor_professor_id(self, user: CurrentUser, inst_id: uuid.UUID) -> uuid.UUID:
        if user.professor_id:
            return user.professor_id
        if user.perfil == TipoPerfil.administrador:
            prof = self.db.scalar(
                select(Professor)
                .join(UsuarioConta, Professor.usuario_id == UsuarioConta.id)
                .where(UsuarioConta.instituicao_id == inst_id)
                .limit(1)
            )
            if prof:
                return prof.id
        raise forbidden("Emissor professor não disponível")

    def create_comunicado(self, user: CurrentUser, body: ComunicadoCreate) -> ComunicadoDetail:
        inst_id = self._inst_id(user)
        emissor_id = self._emissor_professor_id(user, inst_id)
        self._validate_create(body)
        c = Comunicado(
            instituicao_id=inst_id,
            emissor_professor_id=emissor_id,
            titulo=body.titulo,
            corpo=body.corpo,
            status=body.status_inicial,
        )
        self.db.add(c)
        self.db.flush()
        self._save_imagens(c.id, body.imagens_urls)
        self._save_destinatarios(c.id, body.destinatarios)
        if body.status_inicial == StatusComunicado.publicado:
            c.publicado_em = datetime.now(UTC)
            self._expandir_destinatarios(c)
        self.db.commit()
        self.db.refresh(c)
        return self._detail(c, user.id)

    def patch_comunicado(
        self, user: CurrentUser, cid: uuid.UUID, body: ComunicadoPatch
    ) -> ComunicadoDetail:
        inst_id = self._inst_id(user)
        c = self._comunicado_tenant(cid, inst_id)
        if c.status == StatusComunicado.publicado:
            raise forbidden("Comunicado publicado não pode ser editado")
        if body.titulo is not None:
            c.titulo = body.titulo
        if body.corpo is not None:
            c.corpo = body.corpo
        if body.imagens_urls is not None:
            for img in list(c.imagens):
                self.db.delete(img)
            self._save_imagens(c.id, body.imagens_urls)
        if body.destinatarios is not None:
            for d in list(c.destinatarios):
                self.db.delete(d)
            self._save_destinatarios(c.id, body.destinatarios)
        self.db.commit()
        self.db.refresh(c)
        return self._detail(c, user.id)

    def publicar(self, user: CurrentUser, cid: uuid.UUID) -> ComunicadoDetail:
        inst_id = self._inst_id(user)
        c = self._comunicado_tenant(cid, inst_id)
        if not c.destinatarios:
            raise bad_request("Defina destinatários antes de publicar")
        c.status = StatusComunicado.publicado
        c.publicado_em = datetime.now(UTC)
        self._expandir_destinatarios(c)
        self.db.commit()
        self.db.refresh(c)
        return self._detail(c, user.id)

    def marcar_lido(self, user: CurrentUser, cid: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        self._comunicado_tenant(cid, inst_id)
        existing = self.db.scalar(
            select(ComunicadoLeitura).where(
                ComunicadoLeitura.comunicado_id == cid,
                ComunicadoLeitura.usuario_id == user.id,
            )
        )
        if not existing:
            self.db.add(ComunicadoLeitura(comunicado_id=cid, usuario_id=user.id))
            self.db.commit()

    def _save_imagens(self, comunicado_id: uuid.UUID, urls: list[str]) -> None:
        for i, url in enumerate(urls):
            self.db.add(ComunicadoImagem(comunicado_id=comunicado_id, url=url, ordem=i))

    def _save_destinatarios(self, comunicado_id: uuid.UUID, refs: list[DestinatarioRef]) -> None:
        for ref in refs:
            self.db.add(
                ComunicadoDestinatario(
                    comunicado_id=comunicado_id,
                    tipo=ref.tipo,
                    entidade_id=ref.id,
                )
            )

    def _expandir_destinatarios(self, c: Comunicado) -> None:
        usuario_ids: set[uuid.UUID] = set()
        for d in c.destinatarios:
            if d.tipo == TipoDestinatarioComunicado.aluno:
                aluno = self.db.get(Aluno, d.entidade_id)
                if aluno:
                    usuario_ids.add(aluno.usuario_id)
            elif d.tipo == TipoDestinatarioComunicado.turma:
                matriculas = self.db.scalars(
                    select(Matricula).where(
                        Matricula.turma_id == d.entidade_id,
                        Matricula.situacao == SituacaoMatricula.ativa,
                    )
                ).all()
                for mat in matriculas:
                    aluno = self.db.get(Aluno, mat.aluno_id)
                    if aluno:
                        usuario_ids.add(aluno.usuario_id)
            elif d.tipo == TipoDestinatarioComunicado.responsavel:
                resp = self.db.get(Responsavel, d.entidade_id)
                if resp:
                    usuario_ids.add(resp.usuario_id)
            elif d.tipo == TipoDestinatarioComunicado.professor:
                prof = self.db.get(Professor, d.entidade_id)
                if prof:
                    usuario_ids.add(prof.usuario_id)
        for uid in usuario_ids:
            exists = self.db.scalar(
                select(ComunicadoDestinatarioEfetivo).where(
                    ComunicadoDestinatarioEfetivo.comunicado_id == c.id,
                    ComunicadoDestinatarioEfetivo.usuario_id == uid,
                )
            )
            if not exists:
                self.db.add(
                    ComunicadoDestinatarioEfetivo(comunicado_id=c.id, usuario_id=uid)
                )
        for uid in usuario_ids:
            if self.db.get(UsuarioConta, uid):
                pass

    def _contagem_leituras(self, comunicado_id: uuid.UUID) -> tuple[int, int]:
        efetivos = self.db.scalars(
            select(ComunicadoDestinatarioEfetivo.usuario_id).where(
                ComunicadoDestinatarioEfetivo.comunicado_id == comunicado_id
            )
        ).all()
        total = len(efetivos)
        if total == 0:
            return 0, 0
        lidos = self.db.scalar(
            select(func.count())
            .select_from(ComunicadoLeitura)
            .where(
                ComunicadoLeitura.comunicado_id == comunicado_id,
                ComunicadoLeitura.usuario_id.in_(efetivos),
            )
        )
        return total, int(lidos or 0)

    def _detail(
        self,
        c: Comunicado,
        usuario_id: uuid.UUID,
        *,
        incluir_contagem: bool = False,
    ) -> ComunicadoDetail:
        lido = bool(
            self.db.scalar(
                select(ComunicadoLeitura).where(
                    ComunicadoLeitura.comunicado_id == c.id,
                    ComunicadoLeitura.usuario_id == usuario_id,
                )
            )
        )
        total_dest = None
        total_lidos = None
        if incluir_contagem and c.status == StatusComunicado.publicado:
            total_dest, total_lidos = self._contagem_leituras(c.id)
        return ComunicadoDetail(
            id=c.id,
            titulo=c.titulo,
            corpo=c.corpo,
            status=c.status,
            publicado_em=c.publicado_em,
            imagens_urls=[img.url for img in c.imagens],
            destinatarios=[
                DestinatarioRef(tipo=d.tipo, id=d.entidade_id) for d in c.destinatarios
            ],
            lido=lido,
            total_destinatarios=total_dest,
            total_lidos=total_lidos,
        )

    def consultar_leituras(
        self, user: CurrentUser, cid: uuid.UUID
    ) -> ComunicadoLeiturasResponse:
        if user.perfil not in (TipoPerfil.professor, TipoPerfil.administrador):
            raise forbidden()
        inst_id = self._inst_id(user)
        c = self._comunicado_tenant(cid, inst_id)
        efetivos = self.db.scalars(
            select(ComunicadoDestinatarioEfetivo).where(
                ComunicadoDestinatarioEfetivo.comunicado_id == c.id
            )
        ).all()
        itens: list[ComunicadoLeituraItem] = []
        for ef in efetivos:
            u = self.db.get(UsuarioConta, ef.usuario_id)
            leitura = self.db.scalar(
                select(ComunicadoLeitura).where(
                    ComunicadoLeitura.comunicado_id == c.id,
                    ComunicadoLeitura.usuario_id == ef.usuario_id,
                )
            )
            itens.append(
                ComunicadoLeituraItem(
                    usuario_id=ef.usuario_id,
                    nome_exibicao=u.nome_exibicao if u else str(ef.usuario_id),
                    lido=leitura is not None,
                    lido_em=leitura.lido_em if leitura else None,
                )
            )
        itens.sort(key=lambda x: (not x.lido, x.nome_exibicao))
        lidos = sum(1 for i in itens if i.lido)
        return ComunicadoLeiturasResponse(
            total_destinatarios=len(itens),
            total_lidos=lidos,
            itens=itens,
        )

    def marcar_todos_lidos(self, user: CurrentUser) -> None:
        inst_id = self._inst_id(user)
        rows = self.db.scalars(
            select(Comunicado)
            .join(
                ComunicadoDestinatarioEfetivo,
                ComunicadoDestinatarioEfetivo.comunicado_id == Comunicado.id,
            )
            .where(
                Comunicado.instituicao_id == inst_id,
                Comunicado.status == StatusComunicado.publicado,
                ComunicadoDestinatarioEfetivo.usuario_id == user.id,
            )
        ).all()
        for c in rows:
            existing = self.db.scalar(
                select(ComunicadoLeitura).where(
                    ComunicadoLeitura.comunicado_id == c.id,
                    ComunicadoLeitura.usuario_id == user.id,
                )
            )
            if not existing:
                self.db.add(ComunicadoLeitura(comunicado_id=c.id, usuario_id=user.id))
        self.db.commit()

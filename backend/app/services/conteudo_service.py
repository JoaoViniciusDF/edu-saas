from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.exceptions import forbidden, not_found
from app.models.conteudo import MaterialEstudo, PastaConteudo, UploadBlob
from app.models.enums import SituacaoMatricula, TipoPerfil
from app.models.governanca import Matricula, Professor, UsuarioConta
from app.schemas.conteudo import (
    MaterialCreate,
    MaterialPatch,
    MaterialResponse,
    PastaConteudoCreate,
    PastaConteudoPatch,
    PastaConteudoResponse,
    PresignRequest,
    PresignResponse,
)


class ConteudoService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _inst_id(self, user: CurrentUser) -> uuid.UUID:
        if not user.instituicao_id:
            raise forbidden()
        return user.instituicao_id

    def _pasta_tenant(self, pasta_id: uuid.UUID, inst_id: uuid.UUID) -> PastaConteudo:
        p = self.db.get(PastaConteudo, pasta_id)
        if not p or p.instituicao_id != inst_id:
            raise not_found()
        return p

    def list_pastas(self, user: CurrentUser) -> list[PastaConteudoResponse]:
        inst_id = self._inst_id(user)
        stmt = select(PastaConteudo).where(PastaConteudo.instituicao_id == inst_id)
        if user.perfil == TipoPerfil.aluno and user.aluno_id:
            turma_ids = select(Matricula.turma_id).where(
                Matricula.aluno_id == user.aluno_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
            stmt = stmt.where(
                (PastaConteudo.turma_id.is_(None)) | (PastaConteudo.turma_id.in_(turma_ids))
            )
        rows = self.db.scalars(stmt.order_by(PastaConteudo.ordem.nulls_last())).all()
        return [self._pasta_resp(p) for p in rows]

    def create_pasta(self, user: CurrentUser, body: PastaConteudoCreate) -> PastaConteudoResponse:
        inst_id = self._inst_id(user)
        p = PastaConteudo(
            instituicao_id=inst_id,
            turma_id=body.turma_id,
            nome_disciplina=body.nome_disciplina,
            cor_token_ui=body.cor_token_ui,
            icone=body.icone,
            ordem=body.ordem,
        )
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return self._pasta_resp(p)

    def patch_pasta(
        self, user: CurrentUser, pasta_id: uuid.UUID, body: PastaConteudoPatch
    ) -> PastaConteudoResponse:
        inst_id = self._inst_id(user)
        p = self._pasta_tenant(pasta_id, inst_id)
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(p, k, v)
        self.db.commit()
        self.db.refresh(p)
        return self._pasta_resp(p)

    def delete_pasta(self, user: CurrentUser, pasta_id: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        p = self._pasta_tenant(pasta_id, inst_id)
        self.db.delete(p)
        self.db.commit()

    def list_materiais(self, user: CurrentUser, pasta_id: uuid.UUID) -> list[MaterialResponse]:
        inst_id = self._inst_id(user)
        self._pasta_tenant(pasta_id, inst_id)
        rows = self.db.scalars(
            select(MaterialEstudo)
            .where(MaterialEstudo.pasta_conteudo_id == pasta_id)
            .order_by(MaterialEstudo.ordem_exibicao.nulls_last())
        ).all()
        return [self._material_resp(m) for m in rows]

    def create_material(
        self, user: CurrentUser, pasta_id: uuid.UUID, body: MaterialCreate
    ) -> MaterialResponse:
        inst_id = self._inst_id(user)
        self._pasta_tenant(pasta_id, inst_id)
        prof_id = user.professor_id
        if not prof_id and user.perfil == TipoPerfil.administrador:
            prof = self.db.scalar(
                select(Professor)
                .join(UsuarioConta, Professor.usuario_id == UsuarioConta.id)
                .where(UsuarioConta.instituicao_id == inst_id)
                .limit(1)
            )
            prof_id = prof.id if prof else None
        if not prof_id:
            raise forbidden()
        m = MaterialEstudo(
            pasta_conteudo_id=pasta_id,
            professor_autor_id=prof_id,
            titulo=body.titulo,
            descricao=body.descricao,
            tipo_anexo=body.tipo_anexo,
            corpo_texto=body.corpo_texto,
            url_objeto=body.url_objeto,
            blob_id=body.blob_id,
            ordem_exibicao=body.ordem_exibicao,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return self._material_resp(m)

    def get_material(self, user: CurrentUser, material_id: uuid.UUID) -> MaterialResponse:
        inst_id = self._inst_id(user)
        m = self.db.get(MaterialEstudo, material_id)
        if not m:
            raise not_found()
        self._pasta_tenant(m.pasta_conteudo_id, inst_id)
        return self._material_resp(m)

    def patch_material(
        self, user: CurrentUser, material_id: uuid.UUID, body: MaterialPatch
    ) -> MaterialResponse:
        inst_id = self._inst_id(user)
        m = self.db.get(MaterialEstudo, material_id)
        if not m:
            raise not_found()
        self._pasta_tenant(m.pasta_conteudo_id, inst_id)
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(m, k, v)
        self.db.commit()
        self.db.refresh(m)
        return self._material_resp(m)

    def delete_material(self, user: CurrentUser, material_id: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        m = self.db.get(MaterialEstudo, material_id)
        if not m:
            raise not_found()
        self._pasta_tenant(m.pasta_conteudo_id, inst_id)
        self.db.delete(m)
        self.db.commit()

    def presign(self, user: CurrentUser, body: PresignRequest) -> PresignResponse:
        inst_id = self._inst_id(user)
        blob_id = uuid.uuid4()
        storage_key = f"{inst_id}/{body.contexto}/{blob_id}/{body.nome_original}"
        blob = UploadBlob(
            id=blob_id,
            instituicao_id=inst_id,
            criado_por_usuario_id=user.id,
            nome_original=body.nome_original,
            mime_type=body.mime_type,
            tamanho_bytes=body.tamanho_bytes,
            storage_key=storage_key,
            contexto=body.contexto,
        )
        self.db.add(blob)
        self.db.commit()
        return PresignResponse(
            upload_id=blob_id,
            upload_url=f"https://storage.stub.edusaas/{storage_key}",
            storage_key=storage_key,
        )

    def _pasta_resp(self, p: PastaConteudo) -> PastaConteudoResponse:
        return PastaConteudoResponse(
            id=p.id,
            nome_disciplina=p.nome_disciplina,
            turma_id=p.turma_id,
            cor_token_ui=p.cor_token_ui,
            icone=p.icone,
            ordem=p.ordem,
        )

    def _material_resp(self, m: MaterialEstudo) -> MaterialResponse:
        return MaterialResponse(
            id=m.id,
            titulo=m.titulo,
            descricao=m.descricao,
            tipo_anexo=m.tipo_anexo,
            corpo_texto=m.corpo_texto,
            url_objeto=m.url_objeto,
            ordem_exibicao=m.ordem_exibicao,
        )

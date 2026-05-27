"""Contrato JSON de documentos ricos (provas, questões) — Docs/13."""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator


class InlineSpan(BaseModel):
    text: str
    bold: bool = False
    italic: bool = False
    code: bool = False
    href: str | None = None


class BlockHeading(BaseModel):
    type: Literal["heading"] = "heading"
    level: int = Field(ge=1, le=3, default=2)
    content: str = Field(min_length=1)


class BlockParagraph(BaseModel):
    type: Literal["paragraph"] = "paragraph"
    content: str | list[InlineSpan] = ""


class BlockList(BaseModel):
    type: Literal["bulleted_list", "numbered_list"]
    items: list[str] = Field(min_length=1)


class BlockQuote(BaseModel):
    type: Literal["quote"] = "quote"
    content: str = Field(min_length=1)


class BlockCallout(BaseModel):
    type: Literal["callout"] = "callout"
    variant: Literal["info", "warning", "tip"] = "info"
    content: str = Field(min_length=1)


class BlockDivider(BaseModel):
    type: Literal["divider"] = "divider"


class BlockImage(BaseModel):
    type: Literal["image"] = "image"
    url: str = Field(min_length=1)
    caption: str | None = None


Block = Annotated[
    BlockHeading
    | BlockParagraph
    | BlockList
    | BlockQuote
    | BlockCallout
    | BlockDivider
    | BlockImage,
    Field(discriminator="type"),
]


class Documento(BaseModel):
    schema_version: str = "1.0"
    blocks: list[Block] = Field(default_factory=list)

    @field_validator("schema_version")
    @classmethod
    def versao_suportada(cls, v: str) -> str:
        if v != "1.0":
            raise ValueError("schema_version deve ser 1.0")
        return v


def documento_vazio() -> dict[str, Any]:
    return Documento(blocks=[]).model_dump(mode="json")


def texto_para_documento(texto: str) -> Documento:
    t = texto.strip()
    if not t:
        return Documento(blocks=[])
    return Documento(blocks=[BlockParagraph(type="paragraph", content=t)])


def documento_para_texto(doc: Documento | dict[str, Any] | None) -> str:
    if doc is None:
        return ""
    if isinstance(doc, dict):
        doc = Documento.model_validate(doc)
    partes: list[str] = []
    for block in doc.blocks:
        if block.type == "heading":
            partes.append(block.content)
        elif block.type == "paragraph":
            if isinstance(block.content, str):
                partes.append(block.content)
            else:
                partes.append("".join(s.text for s in block.content))
        elif block.type in ("bulleted_list", "numbered_list"):
            partes.extend(block.items)
        elif block.type == "quote":
            partes.append(block.content)
        elif block.type == "callout":
            partes.append(block.content)
        elif block.type == "image" and block.caption:
            partes.append(block.caption)
    return "\n".join(p for p in partes if p).strip()


def documento_para_markdown(doc: Documento | dict[str, Any] | None) -> str:
    if doc is None:
        return ""
    if isinstance(doc, dict):
        doc = Documento.model_validate(doc)
    linhas: list[str] = []
    for block in doc.blocks:
        if block.type == "heading":
            prefix = "#" * block.level
            linhas.append(f"{prefix} {block.content}")
        elif block.type == "paragraph":
            texto = (
                block.content
                if isinstance(block.content, str)
                else "".join(s.text for s in block.content)
            )
            linhas.append(texto)
        elif block.type == "bulleted_list":
            linhas.extend(f"- {item}" for item in block.items)
        elif block.type == "numbered_list":
            linhas.extend(f"{i + 1}. {item}" for i, item in enumerate(block.items))
        elif block.type == "quote":
            linhas.append(f"> {block.content}")
        elif block.type == "callout":
            linhas.append(f"> **{block.variant}**: {block.content}")
        elif block.type == "divider":
            linhas.append("---")
        elif block.type == "image":
            alt = block.caption or "imagem"
            linhas.append(f"![{alt}]({block.url})")
    return "\n\n".join(linhas)

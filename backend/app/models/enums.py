import enum


class TipoPerfil(str, enum.Enum):
    super_admin = "super_admin"
    administrador = "administrador"
    professor = "professor"
    aluno = "aluno"
    responsavel = "responsavel"


class StatusConta(str, enum.Enum):
    ativa = "ativa"
    suspensa = "suspensa"
    pendente_ativacao = "pendente_ativacao"


class SituacaoMatricula(str, enum.Enum):
    ativa = "ativa"
    encerrada = "encerrada"
    transferida = "transferida"


class StatusAvaliacao(str, enum.Enum):
    rascunho = "rascunho"
    publicada = "publicada"
    encerrada = "encerrada"
    inativa = "inativa"


class TipoQuestao(str, enum.Enum):
    multipla_escolha = "multipla_escolha"
    texto_aberto = "texto_aberto"


class StatusSubmissao(str, enum.Enum):
    rascunho = "rascunho"
    enviada = "enviada"
    corrigida_parcialmente = "corrigida_parcialmente"
    corrigida = "corrigida"


class TipoAnexoMaterial(str, enum.Enum):
    pdf = "pdf"
    audio = "audio"
    imagem = "imagem"
    video = "video"
    nota = "nota"


class StatusComunicado(str, enum.Enum):
    rascunho = "rascunho"
    publicado = "publicado"


class TipoDestinatarioComunicado(str, enum.Enum):
    aluno = "aluno"
    turma = "turma"
    responsavel = "responsavel"
    professor = "professor"


class PapelChat(str, enum.Enum):
    usuario = "usuario"
    assistente = "assistente"

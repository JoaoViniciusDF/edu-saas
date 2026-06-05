/** Utilitários de máscara e validação para formulários. */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "")
}

export function mascaraCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function mascaraCnpj(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function mascaraDocumentoLegal(valor: string): string {
  const d = apenasDigitos(valor)
  return d.length > 11 ? mascaraCnpj(valor) : mascaraCpf(valor)
}

export function mascaraTelefoneBr(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function gerarSenhaAleatoria(tamanho = 12): string {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
  let out = ""
  const arr = new Uint32Array(tamanho)
  crypto.getRandomValues(arr)
  for (let i = 0; i < tamanho; i++) {
    out += chars[arr[i]! % chars.length]
  }
  return out
}

export function mensagemErroApi(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as Error).message === "string") {
    const msg = (e as Error).message
    if (msg.includes("422") || msg.toLowerCase().includes("validation")) {
      return "Verifique os campos do formulário (e-mail válido, senha com 6+ caracteres)."
    }
    if (msg.includes("409") || msg.toLowerCase().includes("e-mail")) {
      return "E-mail já cadastrado."
    }
    return msg
  }
  return "Não foi possível concluir a operação."
}

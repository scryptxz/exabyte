// Cliente HTTP para a API REST em Yesod.
// Em desenvolvimento, VITE_API_URL fica vazio e o proxy do Vite encaminha /api para localhost:3000.
const BASE = import.meta.env.VITE_API_URL ?? ''

export async function api(caminho, { method = 'GET', body } = {}) {
  const resposta = await fetch(BASE + caminho, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    // O backend devolve {"erros": [...]} (400) ou {"erro": "..."} (404/409/500)
    const mensagem = dados?.erros?.join(' • ') ?? dados?.erro ?? `Erro HTTP ${resposta.status}`
    throw new Error(mensagem)
  }
  return dados
}

export const brl = (valor) =>
  Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR')

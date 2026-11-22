// Componentes visuais pequenos reutilizados nas páginas.
import { useEffect, useRef, useState } from 'react'
import { brl } from '../api.js'
import { useCarrinho } from '../context/CarrinhoContext.jsx'

export function Alerta({ tipo = 'erro', children, onFechar }) {
  if (!children) return null
  const cores =
    tipo === 'erro'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${cores}`}>
      <span>{children}</span>
      {onFechar && (
        <button onClick={onFechar} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
      )}
    </div>
  )
}

export function Carregando() {
  return <p className="py-10 text-center text-zinc-500">Carregando...</p>
}

// Preço em reais
export function Preco({ valor, grande = false }) {
  return (
    <div>
      <p className={`font-extrabold text-preco ${grande ? 'text-4xl' : 'text-2xl'}`}>{brl(valor)}</p>
    </div>
  )
}

export function Estrelas({ nota }) {
  return (
    <span className="text-amber-400" aria-label={`${nota} de 5`}>
      {'★'.repeat(Math.round(nota))}
      <span className="text-zinc-300">{'★'.repeat(5 - Math.round(nota))}</span>
    </span>
  )
}

// Ícone simples por categoria (sem depender de imagens externas)
const ICONES = {
  Processadores: '🧠',
  'Placas de Vídeo': '🎮',
  'Memória RAM': '⚡',
  Armazenamento: '💾',
  'Placas-mãe': '🔌',
  Fontes: '🔋',
}

export function ImagemProduto({ produto, categoriaNome, grande = false }) {
  if (produto.imagemUrl) {
    return (
      <img
        src={produto.imagemUrl}
        alt={produto.nome}
        className={`w-full rounded-lg bg-white object-contain ${grande ? 'h-80' : 'h-40'}`}
      />
    )
  }
  return (
    <div
      className={`grid w-full place-items-center rounded-lg bg-gradient-to-br from-white to-zinc-50 ${
        grande ? 'h-80 text-8xl' : 'h-40 text-5xl'
      }`}
    >
      {ICONES[categoriaNome] ?? '🖥️'}
    </div>
  )
}

// Situação do estoque do produto (esgotado / últimas unidades / disponível)
export function InfoEstoque({ produto }) {
  const { quantidadeNoCarrinho } = useCarrinho()
  const noCarrinho = quantidadeNoCarrinho(produto.id)
  const estoque = produto.estoque

  let texto, cor
  if (estoque === 0) {
    texto = 'Esgotado'
    cor = 'text-red-600'
  } else if (estoque <= 5) {
    texto = `Últimas ${estoque} unidades`
    cor = 'text-amber-600'
  } else {
    texto = `${estoque} unidades em estoque`
    cor = 'text-emerald-600'
  }

  return (
    <p className="text-xs">
      <span className={`font-semibold ${cor}`}>{texto}</span>
      {noCarrinho > 0 && <span className="text-zinc-500"> · {noCarrinho} no carrinho</span>}
    </p>
  )
}

// Botão "Adicionar": respeita o estoque e fica verde com "Adicionado" após o clique.
export function BotaoAdicionar({ produto, quantidade = 1, texto = 'Adicionar', className = '' }) {
  const { adicionar, disponivel } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const restante = disponivel(produto)
  const esgotado = produto.estoque === 0
  const limite = !esgotado && restante === 0

  function clicar() {
    adicionar(produto, Math.min(quantidade, restante))
    setAdicionado(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdicionado(false), 1500)
  }

  if (adicionado) {
    return (
      <button className={`btn bg-emerald-600 text-white ${className}`} onClick={restante > 0 ? clicar : undefined}>
        ✓ Adicionado
      </button>
    )
  }

  return (
    <button
      className={`btn-primario ${className}`}
      disabled={esgotado || limite}
      title={limite ? 'Todo o estoque deste produto já está no carrinho' : undefined}
      onClick={clicar}
    >
      {esgotado ? 'Esgotado' : limite ? 'Limite atingido' : texto}
    </button>
  )
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Carrinho guardado no navegador (localStorage). Só vira pedido no banco ao finalizar a compra.
// Regra de estoque: a quantidade de um produto no carrinho nunca passa do estoque dele.
const CarrinhoContext = createContext(null)

function carregar() {
  try {
    return JSON.parse(localStorage.getItem('exabyte-carrinho')) ?? []
  } catch {
    return []
  }
}

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState(carregar)

  useEffect(() => {
    try {
      localStorage.setItem('exabyte-carrinho', JSON.stringify(itens))
    } catch {
      /* armazenamento indisponível: carrinho fica só em memória */
    }
  }, [itens])

  // Quantas unidades deste produto já estão no carrinho
  const quantidadeNoCarrinho = (produtoId) =>
    itens.find((i) => i.produto.id === produtoId)?.quantidade ?? 0

  // Quantas unidades ainda podem ser adicionadas (estoque - o que já está no carrinho)
  const disponivel = (produto) => Math.max(0, produto.estoque - quantidadeNoCarrinho(produto.id))

  function adicionar(produto, quantidade = 1) {
    setItens((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id)
      if (existente) {
        return atual.map((i) =>
          i.produto.id === produto.id
            ? { produto, quantidade: Math.min(i.quantidade + quantidade, produto.estoque) }
            : i,
        )
      }
      return [...atual, { produto, quantidade: Math.min(quantidade, produto.estoque) }]
    })
  }

  function alterarQuantidade(produtoId, quantidade) {
    setItens((atual) =>
      atual
        .map((i) =>
          i.produto.id === produtoId
            ? { ...i, quantidade: Math.max(0, Math.min(quantidade, i.produto.estoque)) }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    )
  }

  // Atualiza o estoque dos produtos do carrinho com os dados mais recentes do backend
  // (ex.: outro pedido consumiu o estoque). Itens esgotados saem do carrinho.
  const sincronizarEstoque = useCallback((produtosAtuais) => {
    setItens((atual) => {
      const mudou = atual.some((i) => {
        const novo = produtosAtuais.find((p) => p.id === i.produto.id)
        return novo && novo.estoque !== i.produto.estoque
      })
      if (!mudou) return atual
      return atual
        .map((i) => {
          const novo = produtosAtuais.find((p) => p.id === i.produto.id)
          return novo ? { produto: novo, quantidade: Math.min(i.quantidade, novo.estoque) } : i
        })
        .filter((i) => i.quantidade > 0)
    })
  }, [])

  const remover = (produtoId) => setItens((atual) => atual.filter((i) => i.produto.id !== produtoId))
  const limpar = () => setItens([])
  const total = itens.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0)
  const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0)

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionar,
        alterarQuantidade,
        remover,
        limpar,
        total,
        quantidadeTotal,
        quantidadeNoCarrinho,
        disponivel,
        sincronizarEstoque,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  )
}

export const useCarrinho = () => useContext(CarrinhoContext)

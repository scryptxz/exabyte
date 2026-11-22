import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, brl } from '../api.js'
import { useCarrinho } from '../context/CarrinhoContext.jsx'
import { Alerta } from '../components/Ui.jsx'

// Carrinho + finalização do pedido (POST /api/pedidos).
export default function Carrinho() {
  const { itens, alterarQuantidade, remover, limpar, total, sincronizarEstoque } = useCarrinho()
  const navegar = useNavigate()
  const [clientes, setClientes] = useState([])
  const [enderecos, setEnderecos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [enderecoId, setEnderecoId] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api('/api/clientes').then(setClientes).catch((e) => setErro(e.message))
    // Confere o estoque atual dos produtos (pode ter mudado desde que foram adicionados)
    api('/api/produtos').then(sincronizarEstoque).catch(() => {})
  }, [sincronizarEstoque])

  // Ao escolher o cliente, carrega os endereços dele
  useEffect(() => {
    setEnderecoId('')
    setEnderecos([])
    if (clienteId) {
      api(`/api/clientes/${clienteId}/enderecos`).then(setEnderecos).catch((e) => setErro(e.message))
    }
  }, [clienteId])

  async function finalizar() {
    setErro('')
    setEnviando(true)
    try {
      const resposta = await api('/api/pedidos', {
        method: 'POST',
        body: {
          clienteId: Number(clienteId),
          enderecoId: Number(enderecoId),
          itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
        },
      })
      limpar()
      navegar(`/pedidos?novo=${resposta.pedido.id}`)
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-zinc-500">Seu carrinho está vazio.</p>
        <Link to="/" className="btn-primario">Ver produtos</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-6 text-3xl font-black text-marca-escuro">Carrinho</h1>
        <ul className="space-y-3">
          {itens.map(({ produto, quantidade }) => (
            <li key={produto.id} className="cartao flex flex-wrap items-center gap-4 p-4">
              <div className="flex-1">
                <Link to={`/produtos/${produto.id}`} className="font-semibold hover:text-marca">
                  {produto.nome}
                </Link>
                <p className={`text-xs ${quantidade >= produto.estoque ? 'text-amber-600' : 'text-zinc-500'}`}>
                  {quantidade >= produto.estoque
                    ? `Quantidade máxima em estoque (${produto.estoque})`
                    : `${produto.estoque} unidades em estoque`}
                </p>
              </div>
              <input
                type="number"
                min="0"
                max={produto.estoque}
                className="campo w-20"
                value={quantidade}
                onChange={(e) => alterarQuantidade(produto.id, Number(e.target.value))}
              />
              <span className="w-32 text-right font-bold">{brl(produto.preco * quantidade)}</span>
              <button className="btn-perigo px-3 py-1" onClick={() => remover(produto.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="cartao h-fit space-y-4 p-5">
        <h2 className="text-lg font-bold">Finalizar compra</h2>
        <div>
          <label className="rotulo">Cliente</label>
          <select className="campo" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo">Endereço de entrega</label>
          <select
            className="campo"
            value={enderecoId}
            disabled={!clienteId}
            onChange={(e) => setEnderecoId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {enderecos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.logradouro}, {e.numero} - {e.cidade}/{e.uf}
              </option>
            ))}
          </select>
          {clienteId && enderecos.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Cliente sem endereço. Cadastre em <Link className="underline" to="/admin/clientes">Administração → Clientes</Link>.
            </p>
          )}
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-marca">{brl(total)}</span>
          </div>
        </div>

        <Alerta onFechar={() => setErro('')}>{erro}</Alerta>

        <button
          className="btn-primario w-full"
          disabled={!clienteId || !enderecoId || enviando}
          onClick={finalizar}
        >
          {enviando ? 'Enviando...' : 'Confirmar pedido'}
        </button>
      </aside>
    </div>
  )
}

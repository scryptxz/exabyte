import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, brl, dataHora } from '../api.js'
import { Alerta, Carregando } from '../components/Ui.jsx'

const STATUS = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado']
const COR_STATUS = {
  pendente: 'bg-amber-100 text-amber-700',
  pago: 'bg-sky-100 text-sky-700',
  enviado: 'bg-violet-100 text-violet-700',
  entregue: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
}

// Lista de pedidos, detalhes, alteração de status (PUT) e exclusão (DELETE).
export default function Pedidos() {
  const [parametros] = useSearchParams()
  const novoId = parametros.get('novo')
  const [pedidos, setPedidos] = useState(null)
  const [clientes, setClientes] = useState([])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [aberto, setAberto] = useState(novoId ? Number(novoId) : null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    const query = filtroCliente ? `?cliente=${filtroCliente}` : ''
    api(`/api/pedidos${query}`).then(setPedidos).catch((e) => setErro(e.message))
  }, [filtroCliente])

  useEffect(() => {
    api('/api/clientes').then(setClientes).catch(() => {})
  }, [])
  useEffect(carregar, [carregar])

  const nomeCliente = (id) => clientes.find((c) => c.id === id)?.nome ?? `Cliente #${id}`

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-black text-marca-escuro">Pedidos</h1>
        <div className="w-64">
          <label className="rotulo">Filtrar por cliente</label>
          <select className="campo" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {novoId && <Alerta tipo="sucesso">Pedido #{novoId} criado com sucesso!</Alerta>}
      <Alerta onFechar={() => setErro('')}>{erro}</Alerta>

      {!pedidos ? (
        <Carregando />
      ) : pedidos.length === 0 ? (
        <p className="text-zinc-500">Nenhum pedido encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.id} className="cartao">
              <button
                className="flex w-full cursor-pointer flex-wrap items-center gap-4 p-4 text-left"
                onClick={() => setAberto(aberto === p.id ? null : p.id)}
              >
                <span className="font-mono text-zinc-500">#{p.id}</span>
                <span className="flex-1 font-semibold">{nomeCliente(p.clienteId)}</span>
                <span className="text-sm text-zinc-500">{dataHora(p.criadoEm)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_STATUS[p.status]}`}>
                  {p.status}
                </span>
                <span className="w-28 text-right font-bold text-marca">{brl(p.total)}</span>
              </button>
              {aberto === p.id && (
                <DetalhePedido id={p.id} onAlterado={carregar} onErro={setErro} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DetalhePedido({ id, onAlterado, onErro }) {
  const [dados, setDados] = useState(null)

  useEffect(() => {
    api(`/api/pedidos/${id}`).then(setDados).catch((e) => onErro(e.message))
  }, [id, onErro])

  async function mudarStatus(status) {
    if (status === 'cancelado' && !confirm('Cancelar o pedido? Os itens voltarão ao estoque.')) return
    try {
      setDados(await api(`/api/pedidos/${id}`, { method: 'PUT', body: { status } }))
      onAlterado()
    } catch (e) {
      onErro(e.message)
    }
  }

  async function excluir() {
    if (!confirm('Excluir o pedido definitivamente?')) return
    try {
      await api(`/api/pedidos/${id}`, { method: 'DELETE' })
      onAlterado()
    } catch (e) {
      onErro(e.message)
    }
  }

  if (!dados) return <div className="border-t border-zinc-200 p-4"><Carregando /></div>
  const { pedido, endereco, itens } = dados

  return (
    <div className="grid gap-6 border-t border-zinc-200 p-4 md:grid-cols-[1fr_260px]">
      <div>
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-1">Produto</th>
              <th className="py-1 text-right">Qtd.</th>
              <th className="py-1 text-right">Unitário</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-t border-zinc-200">
                <td className="py-2">{i.produtoNome}</td>
                <td className="py-2 text-right">{i.quantidade}</td>
                <td className="py-2 text-right">{brl(i.precoUnitario)}</td>
                <td className="py-2 text-right">{brl(i.precoUnitario * i.quantidade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {endereco && (
          <p className="mt-4 text-sm text-zinc-500">
            Entrega: {endereco.logradouro}, {endereco.numero}
            {endereco.complemento ? ` (${endereco.complemento})` : ''} — {endereco.bairro}, {endereco.cidade}/{endereco.uf} — CEP {endereco.cep}
          </p>
        )}
      </div>
      <div className="space-y-3 text-sm">
        <p className="flex justify-between"><span>Total</span><strong>{brl(pedido.total)}</strong></p>
        <div>
          <label className="rotulo">Status</label>
          <select
            className="campo"
            value={pedido.status}
            disabled={pedido.status === 'cancelado'}
            onChange={(e) => mudarStatus(e.target.value)}
          >
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-perigo w-full" onClick={excluir}>Excluir pedido</button>
      </div>
    </div>
  )
}

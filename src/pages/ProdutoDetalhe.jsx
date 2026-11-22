import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, dataHora } from '../api.js'
import { useCarrinho } from '../context/CarrinhoContext.jsx'
import { Alerta, BotaoAdicionar, Carregando, Estrelas, ImagemProduto, InfoEstoque, Preco } from '../components/Ui.jsx'

// Detalhe do produto + CRUD de avaliações.
export default function ProdutoDetalhe() {
  const { id } = useParams()
  const [produto, setProduto] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [fabricante, setFabricante] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState(null)
  const [clientes, setClientes] = useState([])
  const [quantidade, setQuantidade] = useState(1)
  const [mensagem, setMensagem] = useState({ tipo: 'erro', texto: '' })
  const { disponivel, sincronizarEstoque } = useCarrinho()

  const avisar = (texto, tipo = 'erro') => setMensagem({ tipo, texto })

  const carregarAvaliacoes = useCallback(() => {
    api(`/api/produtos/${id}/avaliacoes`).then(setAvaliacoes).catch((e) => avisar(e.message))
  }, [id])

  useEffect(() => {
    api(`/api/produtos/${id}`)
      .then(async (p) => {
        setProduto(p)
        sincronizarEstoque([p])
        setCategoria(await api(`/api/categorias/${p.categoriaId}`))
        setFabricante(await api(`/api/fabricantes/${p.fabricanteId}`))
      })
      .catch((e) => avisar(e.message))
    api('/api/clientes').then(setClientes).catch(() => {})
    carregarAvaliacoes()
  }, [id, carregarAvaliacoes, sincronizarEstoque])

  if (mensagem.texto && !produto) return <Alerta>{mensagem.texto}</Alerta>
  if (!produto) return <Carregando />

  return (
    <div className="space-y-10">
      <Link to="/" className="text-sm text-zinc-500 hover:text-marca">← Voltar para a loja</Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ImagemProduto produto={produto} categoriaNome={categoria?.nome} grande />
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {fabricante?.nome} · {categoria?.nome}
          </p>
          <h1 className="text-3xl font-black text-marca-escuro">{produto.nome}</h1>
          {avaliacoes?.quantidade > 0 && (
            <p className="text-sm">
              <Estrelas nota={avaliacoes.media} /> {avaliacoes.media.toFixed(1)} ({avaliacoes.quantidade} avaliações)
            </p>
          )}
          <p className="text-zinc-600">{produto.descricao}</p>
          <Preco valor={produto.preco} grande />
          <InfoEstoque produto={produto} />
          {produto.estoque > 0 && (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={Math.max(1, disponivel(produto))}
                disabled={disponivel(produto) === 0}
                className="campo w-24"
                value={quantidade}
                onChange={(e) =>
                  setQuantidade(Math.max(1, Math.min(disponivel(produto), Number(e.target.value))))
                }
              />
              <BotaoAdicionar produto={produto} quantidade={quantidade} texto="Adicionar ao carrinho" />
            </div>
          )}
          <Alerta tipo={mensagem.tipo} onFechar={() => avisar('')}>{mensagem.texto}</Alerta>
        </div>
      </div>

      <section className="grid gap-8 md:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-4 text-xl font-bold">Avaliações</h2>
          {!avaliacoes ? (
            <Carregando />
          ) : avaliacoes.avaliacoes.length === 0 ? (
            <p className="text-zinc-500">Este produto ainda não foi avaliado.</p>
          ) : (
            <ul className="space-y-3">
              {avaliacoes.avaliacoes.map(({ avaliacao, clienteNome }) => (
                <ItemAvaliacao
                  key={avaliacao.id}
                  avaliacao={avaliacao}
                  clienteNome={clienteNome}
                  onAlterado={carregarAvaliacoes}
                  onErro={avisar}
                />
              ))}
            </ul>
          )}
        </div>
        <NovaAvaliacao produtoId={id} clientes={clientes} onCriada={carregarAvaliacoes} onErro={avisar} />
      </section>
    </div>
  )
}

function ItemAvaliacao({ avaliacao, clienteNome, onAlterado, onErro }) {
  const [editando, setEditando] = useState(false)
  const [nota, setNota] = useState(avaliacao.nota)
  const [comentario, setComentario] = useState(avaliacao.comentario ?? '')

  async function salvar() {
    try {
      await api(`/api/avaliacoes/${avaliacao.id}`, { method: 'PUT', body: { nota, comentario } })
      setEditando(false)
      onAlterado()
    } catch (e) {
      onErro(e.message)
    }
  }

  async function excluir() {
    if (!confirm('Excluir esta avaliação?')) return
    try {
      await api(`/api/avaliacoes/${avaliacao.id}`, { method: 'DELETE' })
      onAlterado()
    } catch (e) {
      onErro(e.message)
    }
  }

  return (
    <li className="cartao p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {clienteNome} <Estrelas nota={avaliacao.nota} />
        </p>
        <span className="text-xs text-zinc-400">{dataHora(avaliacao.criadaEm)}</span>
      </div>
      {editando ? (
        <div className="mt-3 space-y-2">
          <SeletorNota nota={nota} setNota={setNota} />
          <textarea className="campo" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-primario" onClick={salvar}>Salvar</button>
            <button className="btn-secundario" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          {avaliacao.comentario && <p className="mt-2 text-zinc-600">{avaliacao.comentario}</p>}
          <div className="mt-3 flex gap-2">
            <button className="btn-secundario px-3 py-1" onClick={() => setEditando(true)}>Editar</button>
            <button className="btn-perigo px-3 py-1" onClick={excluir}>Excluir</button>
          </div>
        </>
      )}
    </li>
  )
}

function SeletorNota({ nota, setNota }) {
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setNota(n)}
          className={`cursor-pointer ${n <= nota ? 'text-amber-400' : 'text-zinc-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function NovaAvaliacao({ produtoId, clientes, onCriada, onErro }) {
  const [clienteId, setClienteId] = useState('')
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')

  async function enviar(e) {
    e.preventDefault()
    try {
      await api(`/api/produtos/${produtoId}/avaliacoes`, {
        method: 'POST',
        body: { clienteId: Number(clienteId), nota, comentario: comentario || null },
      })
      setComentario('')
      onCriada()
    } catch (err) {
      onErro(err.message)
    }
  }

  return (
    <form onSubmit={enviar} className="cartao h-fit space-y-3 p-4">
      <h3 className="font-bold">Avaliar produto</h3>
      <div>
        <label className="rotulo">Cliente</label>
        <select className="campo" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecione...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="rotulo">Nota</label>
        <SeletorNota nota={nota} setNota={setNota} />
      </div>
      <div>
        <label className="rotulo">Comentário</label>
        <textarea className="campo" rows="3" value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>
      <button className="btn-primario w-full">Enviar avaliação</button>
    </form>
  )
}

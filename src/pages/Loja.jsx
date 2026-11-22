import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useCarrinho } from '../context/CarrinhoContext.jsx'
import { Alerta, BotaoAdicionar, Carregando, ImagemProduto, InfoEstoque, Preco } from '../components/Ui.jsx'

// Vitrine: lista os produtos com filtro por categoria, fabricante e busca por nome.
export default function Loja() {
  const [produtos, setProdutos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [fabricantes, setFabricantes] = useState([])
  const [filtro, setFiltro] = useState({ categoria: '', fabricante: '', busca: '' })
  const [erro, setErro] = useState('')
  const { sincronizarEstoque } = useCarrinho()

  useEffect(() => {
    api('/api/categorias').then(setCategorias).catch((e) => setErro(e.message))
    api('/api/fabricantes').then(setFabricantes).catch((e) => setErro(e.message))
  }, [])

  // Recarrega os produtos sempre que um filtro muda (busca com pequeno atraso)
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filtro).forEach(([chave, valor]) => valor && params.set(chave, valor))
    const t = setTimeout(() => {
      api(`/api/produtos?${params}`)
        .then((lista) => {
          setProdutos(lista)
          sincronizarEstoque(lista)
        })
       .catch((e) => setErro(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [filtro, sincronizarEstoque])

  const nomeCategoria = (id) => categorias.find((c) => c.id === id)?.nome
  const nomeFabricante = (id) => fabricantes.find((f) => f.id === id)?.nome

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit space-y-5 rounded-xl bg-painel p-5 text-zinc-200 shadow-md lg:sticky lg:top-32">
        <div>
          <label className="rotulo text-marca-claro">Buscar</label>
          <input
            className="campo"
            placeholder="Ex.: Ryzen, RTX..."
            value={filtro.busca}
            onChange={(e) => setFiltro({ ...filtro, busca: e.target.value })}
          />
        </div>
        <div>
          <p className="rotulo border-t border-white/10 pt-4 text-marca-claro">Categorias</p>
          <div className="flex flex-wrap gap-1 lg:flex-col">
            {[{ id: '', nome: 'Todas' }, ...categorias].map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltro({ ...filtro, categoria: c.id })}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm ${
                  filtro.categoria === c.id ? 'bg-marca font-semibold text-white' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="rotulo border-t border-white/10 pt-4 text-marca-claro">Fabricante</label>
          <select
            className="campo"
            value={filtro.fabricante}
            onChange={(e) => setFiltro({ ...filtro, fabricante: e.target.value })}
          >
            <option value="">Todos</option>
            {fabricantes.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
      </aside>

      <section>

        <Alerta onFechar={() => setErro('')}>{erro}</Alerta>

        {!produtos ? (
          <Carregando />
        ) : produtos.length === 0 ? (
          <p className="text-zinc-500">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {produtos.map((p) => (
              <article key={p.id} className="cartao flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <Link to={`/produtos/${p.id}`}>
                  <ImagemProduto produto={p} categoriaNome={nomeCategoria(p.categoriaId)} />
                </Link>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">
                    {nomeFabricante(p.fabricanteId)} · {nomeCategoria(p.categoriaId)}
                  </p>
                  <Link to={`/produtos/${p.id}`} className="leading-snug text-zinc-800 hover:text-marca">
                    {p.nome}
                  </Link>
                </div>
                <InfoEstoque produto={p} />
                <div className="flex items-end justify-between gap-2">
                  <Preco valor={p.preco} />
                  <BotaoAdicionar produto={p} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { api, brl } from '../../api.js'
import { Alerta, Carregando } from '../../components/Ui.jsx'

const VAZIO = {
  nome: '',
  descricao: '',
  preco: '',
  estoque: '',
  imagemUrl: '',
  categoriaId: '',
  fabricanteId: '',
}

// CRUD de produtos (GET/POST/PUT/DELETE em /api/produtos).
export default function AdminProdutos() {
  const [produtos, setProdutos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [fabricantes, setFabricantes] = useState([])
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState({ tipo: 'erro', texto: '' })

  const erro = (e) => setMensagem({ tipo: 'erro', texto: e.message })

  const carregar = useCallback(() => {
    api('/api/produtos').then(setProdutos).catch(erro)
  }, [])

  useEffect(() => {
    carregar()
    api('/api/categorias').then(setCategorias).catch(erro)
    api('/api/fabricantes').then(setFabricantes).catch(erro)
  }, [carregar])

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  function cancelar() {
    setForm(VAZIO)
    setEditandoId(null)
  }

  function editar(p) {
    setEditandoId(p.id)
    setForm({ ...p, imagemUrl: p.imagemUrl ?? '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvar(e) {
    e.preventDefault()
    // Converte os tipos para o formato esperado pelo backend (Double, Int, chaves numéricas)
    const corpo = {
      nome: form.nome,
      descricao: form.descricao,
      preco: Number(form.preco),
      estoque: Number(form.estoque),
      imagemUrl: form.imagemUrl.trim() || null,
      categoriaId: Number(form.categoriaId),
      fabricanteId: Number(form.fabricanteId),
    }
    try {
      if (editandoId) await api(`/api/produtos/${editandoId}`, { method: 'PUT', body: corpo })
      else await api('/api/produtos', { method: 'POST', body: corpo })
      setMensagem({ tipo: 'sucesso', texto: 'Produto salvo com sucesso.' })
      cancelar()
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  async function excluir(p) {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    try {
      await api(`/api/produtos/${p.id}`, { method: 'DELETE' })
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  const nome = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '—'

  return (
    <div className="space-y-6">
      <form onSubmit={salvar} className="cartao grid gap-3 p-4 md:grid-cols-4">
        <h2 className="font-bold md:col-span-4">
          {editandoId ? `Editar produto #${editandoId}` : 'Novo produto'}
        </h2>
        <div className="md:col-span-2">
          <label className="rotulo">Nome *</label>
          <input className="campo" required value={form.nome} onChange={alterar('nome')} />
        </div>
        <div>
          <label className="rotulo">Preço (R$) *</label>
          <input className="campo" type="number" step="0.01" min="0.01" required value={form.preco} onChange={alterar('preco')} />
        </div>
        <div>
          <label className="rotulo">Estoque *</label>
          <input className="campo" type="number" min="0" required value={form.estoque} onChange={alterar('estoque')} />
        </div>
        <div className="md:col-span-2">
          <label className="rotulo">Descrição *</label>
          <input className="campo" required value={form.descricao} onChange={alterar('descricao')} />
        </div>
        <div>
          <label className="rotulo">Categoria *</label>
          <select className="campo" required value={form.categoriaId} onChange={alterar('categoriaId')}>
            <option value="">Selecione...</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo">Fabricante *</label>
          <select className="campo" required value={form.fabricanteId} onChange={alterar('fabricanteId')}>
            <option value="">Selecione...</option>
            {fabricantes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="rotulo">URL da imagem (opcional)</label>
          <input className="campo" value={form.imagemUrl} onChange={alterar('imagemUrl')} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-primario flex-1">Salvar</button>
          {editandoId && <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>}
        </div>
      </form>

      <Alerta tipo={mensagem.tipo} onFechar={() => setMensagem({ ...mensagem, texto: '' })}>
        {mensagem.texto}
      </Alerta>

      {!produtos ? (
        <Carregando />
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Fabricante</th>
                <th className="p-3 text-right">Preço</th>
                <th className="p-3 text-right">Estoque</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t border-zinc-200">
                  <td className="p-3 text-zinc-400">{p.id}</td>
                  <td className="p-3">{p.nome}</td>
                  <td className="p-3">{nome(categorias, p.categoriaId)}</td>
                  <td className="p-3">{nome(fabricantes, p.fabricanteId)}</td>
                  <td className="p-3 text-right">{brl(p.preco)}</td>
                  <td className={`p-3 text-right ${p.estoque === 0 ? 'text-red-600' : ''}`}>{p.estoque}</td>
                  <td className="space-x-2 p-3 text-right whitespace-nowrap">
                    <button className="btn-secundario px-3 py-1" onClick={() => editar(p)}>Editar</button>
                    <button className="btn-perigo px-3 py-1" onClick={() => excluir(p)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'
import { Alerta, Carregando } from '../../components/Ui.jsx'

// CRUD genérico para entidades só com campos de texto (Categoria e Fabricante).
// Campos opcionais vazios são enviados como null (Maybe Text no Haskell).
export default function CrudSimples({ titulo, endpoint, campos }) {
  const vazio = Object.fromEntries(campos.map((c) => [c.nome, '']))
  const [registros, setRegistros] = useState(null)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState({ tipo: 'erro', texto: '' })

  const carregar = useCallback(() => {
    api(endpoint).then(setRegistros).catch((e) => setMensagem({ tipo: 'erro', texto: e.message }))
  }, [endpoint])
  useEffect(carregar, [carregar])

  function cancelar() {
    setForm(vazio)
    setEditandoId(null)
  }

  async function salvar(e) {
    e.preventDefault()
    const corpo = Object.fromEntries(
      campos.map((c) => [c.nome, form[c.nome]?.trim() || (c.obrigatorio ? '' : null)]),
    )
    try {
      if (editandoId) {
        await api(`${endpoint}/${editandoId}`, { method: 'PUT', body: corpo })
      } else {
        await api(endpoint, { method: 'POST', body: corpo })
      }
      setMensagem({ tipo: 'sucesso', texto: `Registro salvo com sucesso.` })
      cancelar()
      carregar()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  async function excluir(registro) {
    if (!confirm(`Excluir "${registro.nome}"?`)) return
    try {
      await api(`${endpoint}/${registro.id}`, { method: 'DELETE' })
      carregar()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  function editar(registro) {
    setEditandoId(registro.id)
    setForm(Object.fromEntries(campos.map((c) => [c.nome, registro[c.nome] ?? ''])))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <Alerta tipo={mensagem.tipo} onFechar={() => setMensagem({ ...mensagem, texto: '' })}>
          {mensagem.texto}
        </Alerta>
        {!registros ? (
          <Carregando />
        ) : (
          <div className="cartao overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="p-3">#</th>
                  {campos.map((c) => <th key={c.nome} className="p-3">{c.rotulo}</th>)}
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-200">
                    <td className="p-3 text-zinc-400">{r.id}</td>
                    {campos.map((c) => <td key={c.nome} className="p-3">{r[c.nome] ?? '—'}</td>)}
                    <td className="space-x-2 p-3 text-right whitespace-nowrap">
                      <button className="btn-secundario px-3 py-1" onClick={() => editar(r)}>Editar</button>
                      <button className="btn-perigo px-3 py-1" onClick={() => excluir(r)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={salvar} className="cartao h-fit space-y-3 p-4">
        <h2 className="font-bold">{editandoId ? `Editar ${titulo} #${editandoId}` : `Cadastrar ${titulo.toLowerCase()}`}</h2>
        {campos.map((c) => (
          <div key={c.nome}>
            <label className="rotulo">{c.rotulo}{c.obrigatorio && ' *'}</label>
            <input
              className="campo"
              required={c.obrigatorio}
              value={form[c.nome]}
              onChange={(e) => setForm({ ...form, [c.nome]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button className="btn-primario flex-1">Salvar</button>
          {editandoId && <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>}
        </div>
      </form>
    </div>
  )
}

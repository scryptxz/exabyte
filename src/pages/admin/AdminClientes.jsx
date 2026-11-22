import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'
import { Alerta, Carregando } from '../../components/Ui.jsx'

const VAZIO = { nome: '', email: '', cpf: '', telefone: '' }

// CRUD de clientes + gerenciamento dos endereços do cliente selecionado.
export default function AdminClientes() {
  const [clientes, setClientes] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [selecionado, setSelecionado] = useState(null)
  const [mensagem, setMensagem] = useState({ tipo: 'erro', texto: '' })

  const erro = (e) => setMensagem({ tipo: 'erro', texto: e.message })

  const carregar = useCallback(() => {
    api('/api/clientes').then(setClientes).catch(erro)
  }, [])
  useEffect(carregar, [carregar])

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  function cancelar() {
    setForm(VAZIO)
    setEditandoId(null)
  }

  async function salvar(e) {
    e.preventDefault()
    const corpo = { ...form, telefone: form.telefone.trim() || null }
    try {
      if (editandoId) await api(`/api/clientes/${editandoId}`, { method: 'PUT', body: corpo })
      else await api('/api/clientes', { method: 'POST', body: corpo })
      setMensagem({ tipo: 'sucesso', texto: 'Cliente salvo com sucesso.' })
      cancelar()
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  async function excluir(c) {
    if (!confirm(`Excluir o cliente "${c.nome}"? Endereços e avaliações dele também serão removidos.`)) return
    try {
      await api(`/api/clientes/${c.id}`, { method: 'DELETE' })
      if (selecionado?.id === c.id) setSelecionado(null)
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Alerta tipo={mensagem.tipo} onFechar={() => setMensagem({ ...mensagem, texto: '' })}>
            {mensagem.texto}
          </Alerta>
          {!clientes ? (
            <Carregando />
          ) : (
            <div className="cartao overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-500">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">CPF</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-t border-zinc-200 ${selecionado?.id === c.id ? 'bg-marca/5' : ''}`}
                    >
                      <td className="p-3 text-zinc-400">{c.id}</td>
                      <td className="p-3">{c.nome}</td>
                      <td className="p-3">{c.email}</td>
                      <td className="p-3 font-mono">{c.cpf}</td>
                      <td className="space-x-2 p-3 text-right whitespace-nowrap">
                        <button className="btn-secundario px-3 py-1" onClick={() => setSelecionado(c)}>Endereços</button>
                        <button
                          className="btn-secundario px-3 py-1"
                          onClick={() => {
                            setEditandoId(c.id)
                            setForm({ ...c, telefone: c.telefone ?? '' })
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn-perigo px-3 py-1" onClick={() => excluir(c)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={salvar} className="cartao h-fit space-y-3 p-4">
          <h2 className="font-bold">{editandoId ? `Editar cliente #${editandoId}` : 'Novo cliente'}</h2>
          <div>
            <label className="rotulo">Nome *</label>
            <input className="campo" required value={form.nome} onChange={alterar('nome')} />
          </div>
          <div>
            <label className="rotulo">E-mail *</label>
            <input className="campo" type="email" required value={form.email} onChange={alterar('email')} />
          </div>
          <div>
            <label className="rotulo">CPF *</label>
            <input className="campo" required placeholder="000.000.000-00" value={form.cpf} onChange={alterar('cpf')} />
          </div>
          <div>
            <label className="rotulo">Telefone</label>
            <input className="campo" value={form.telefone} onChange={alterar('telefone')} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primario flex-1">Salvar</button>
            {editandoId && <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>}
          </div>
        </form>
      </div>

      {selecionado && <Enderecos key={selecionado.id} cliente={selecionado} />}
    </div>
  )
}

// Endereços do cliente. O backend completa logradouro/bairro/cidade/UF consultando o ViaCEP.
function Enderecos({ cliente }) {
  const vazio = { cep: '', numero: '', complemento: '' }
  const [enderecos, setEnderecos] = useState(null)
  const [form, setForm] = useState(vazio)
  const [previa, setPrevia] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState({ tipo: 'erro', texto: '' })

  const erro = (e) => setMensagem({ tipo: 'erro', texto: e.message })

  const carregar = useCallback(() => {
    api(`/api/clientes/${cliente.id}/enderecos`).then(setEnderecos).catch(erro)
  }, [cliente.id])
  useEffect(carregar, [carregar])

  // Consulta o CEP (via backend -> ViaCEP) assim que tiver 8 dígitos
  async function aoDigitarCep(valor) {
    setForm({ ...form, cep: valor })
    setPrevia(null)
    if (valor.replace(/\D/g, '').length === 8) {
      try {
        setPrevia(await api(`/api/externo/cep/${valor.replace(/\D/g, '')}`))
      } catch (e) {
        erro(e)
      }
    }
  }

  function cancelar() {
    setForm(vazio)
    setPrevia(null)
    setEditandoId(null)
  }

  async function salvar(e) {
    e.preventDefault()
    const corpo = { ...form, complemento: form.complemento.trim() || null }
    try {
      if (editandoId) await api(`/api/enderecos/${editandoId}`, { method: 'PUT', body: corpo })
      else await api(`/api/clientes/${cliente.id}/enderecos`, { method: 'POST', body: corpo })
      setMensagem({ tipo: 'sucesso', texto: 'Endereço salvo.' })
      cancelar()
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este endereço?')) return
    try {
      await api(`/api/enderecos/${id}`, { method: 'DELETE' })
      carregar()
    } catch (err) {
      erro(err)
    }
  }

  return (
    <section className="cartao p-4">
      <h2 className="mb-4 text-lg font-bold">Endereços de {cliente.nome}</h2>
      <Alerta tipo={mensagem.tipo} onFechar={() => setMensagem({ ...mensagem, texto: '' })}>
        {mensagem.texto}
      </Alerta>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {!enderecos ? (
          <Carregando />
        ) : enderecos.length === 0 ? (
          <p className="text-zinc-500">Nenhum endereço cadastrado.</p>
        ) : (
          <ul className="space-y-2">
            {enderecos.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 text-sm">
                <span>
                  {e.logradouro}, {e.numero}
                  {e.complemento ? ` (${e.complemento})` : ''} — {e.bairro}, {e.cidade}/{e.uf} — CEP {e.cep}
                </span>
                <span className="space-x-2">
                  <button
                    className="btn-secundario px-3 py-1"
                    onClick={() => {
                      setEditandoId(e.id)
                      setForm({ cep: e.cep, numero: e.numero, complemento: e.complemento ?? '' })
                    }}
                  >
                    Editar
                  </button>
                  <button className="btn-perigo px-3 py-1" onClick={() => excluir(e.id)}>Excluir</button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={salvar} className="space-y-3">
          <h3 className="font-semibold">{editandoId ? `Editar endereço #${editandoId}` : 'Novo endereço'}</h3>
          <div>
            <label className="rotulo">CEP *</label>
            <input className="campo" required placeholder="00000-000" value={form.cep} onChange={(e) => aoDigitarCep(e.target.value)} />
          </div>
          {previa && (
            <p className="rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600">
              ViaCEP: {previa.logradouro || '(sem logradouro)'}, {previa.bairro} — {previa.cidade}/{previa.uf}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="rotulo">Número *</label>
              <input className="campo" required value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div>
              <label className="rotulo">Complemento</label>
              <input className="campo" value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primario flex-1">Salvar endereço</button>
            {editandoId && <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>}
          </div>
        </form>
      </div>
    </section>
  )
}

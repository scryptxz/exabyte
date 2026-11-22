import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import AdminProdutos from './AdminProdutos.jsx'
import AdminClientes from './AdminClientes.jsx'
import CrudSimples from './CrudSimples.jsx'

const aba = ({ isActive }) =>
  `border-b-2 px-4 py-2 text-sm font-medium ${
    isActive ? 'border-marca text-marca' : 'border-transparent text-zinc-500 hover:text-marca'
  }`

export default function Admin() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-black text-marca-escuro">Administração</h1>
      <nav className="mb-6 flex flex-wrap border-b border-zinc-200">
        <NavLink to="/admin/produtos" className={aba}>Produtos</NavLink>
        <NavLink to="/admin/categorias" className={aba}>Categorias</NavLink>
        <NavLink to="/admin/fabricantes" className={aba}>Fabricantes</NavLink>
        <NavLink to="/admin/clientes" className={aba}>Clientes e endereços</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="/admin/produtos" replace />} />
        <Route path="produtos" element={<AdminProdutos />} />
        <Route
          path="categorias"
          element={
            <CrudSimples
              key="categorias"
              titulo="Categoria"
              endpoint="/api/categorias"
              campos={[
                { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
                { nome: 'descricao', rotulo: 'Descrição' },
              ]}
            />
          }
        />
        <Route
          path="fabricantes"
          element={
            <CrudSimples
              key="fabricantes"
              titulo="Fabricante"
              endpoint="/api/fabricantes"
              campos={[
                { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
                { nome: 'pais', rotulo: 'País' },
                { nome: 'site', rotulo: 'Site' },
              ]}
            />
          }
        />
        <Route path="clientes" element={<AdminClientes />} />
      </Routes>
    </div>
  )
}

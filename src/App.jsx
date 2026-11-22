import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Loja from './pages/Loja.jsx'
import ProdutoDetalhe from './pages/ProdutoDetalhe.jsx'
import Carrinho from './pages/Carrinho.jsx'
import Pedidos from './pages/Pedidos.jsx'
import Admin from './pages/admin/Admin.jsx'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Loja />} />
          <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<p className="text-zinc-500">Página não encontrada.</p>} />
        </Routes>
      </main>
    </div>
  )
}

import { Link, NavLink } from 'react-router-dom'
import { useCarrinho } from '../context/CarrinhoContext.jsx'

const linkClasse = ({ isActive }) =>
  `rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
    isActive ? 'bg-marca text-white' : 'text-zinc-200 hover:text-white'
  }`

export default function Navbar() {
  const { quantidadeTotal } = useCarrinho()

  return (
    <header className="sticky top-0 z-10 shadow-md">
      {/* Faixa superior: logo e carrinho */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
          <Link to="/" className="shrink-0">
            <img src="/logo-exabyte.png" alt="Exabyte E-Shop" className="h-10 w-auto sm:h-12" />
          </Link>

          <div className="flex-1" />

          <NavLink to="/carrinho" className="btn-primario">
            Carrinho
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-marca">
              {quantidadeTotal}
            </span>
          </NavLink>
        </div>
      </div>

      {/* Faixa de navegação escura */}
      <div className="bg-painel">
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2">
          <NavLink to="/" end className={linkClasse}>Loja</NavLink>
          <NavLink to="/pedidos" className={linkClasse}>Pedidos</NavLink>
          <NavLink to="/admin" className={linkClasse}>Administração</NavLink>
        </nav>
      </div>
    </header>
  )
}

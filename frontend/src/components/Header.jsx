import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, LogOut, Menu, X } from "lucide-react";
import { api, CATEGORY_META, formatPrice } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logout } = useAuth();
  const { setOpen, totalQty } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const h = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      try {
        const { data } = await api.get("/products", { params: { search: query, limit: 6 } });
        setResults(data);
      } catch { setResults([]); }
    }, 180);
    return () => clearTimeout(h);
  }, [query]);

  useEffect(() => {
    const onClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  return (
    <header className="glass-nav sticky top-0 z-50 border-b border-line/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center gap-6">
        <Link to="/" data-testid="logo-link" className="font-display text-xl font-semibold tracking-tight text-ink-900">
          Compu<span className="text-brand">Max</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <NavLink
              key={key}
              to={meta.path}
              data-testid={`nav-${key}`}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full transition-colors ${isActive ? "bg-surface-soft text-ink-900" : "text-ink-500 hover:text-ink-900"}`}
            >
              {meta.label}
            </NavLink>
          ))}
        </nav>

        <form
          ref={searchRef}
          onSubmit={onSubmitSearch}
          className="flex-1 max-w-md relative hidden sm:block"
          data-testid="search-form"
        >
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input
              data-testid="search-input"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              placeholder="Buscar laptops, componentes, marcas…"
              className="pl-10 bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand rounded-full h-10"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-line/50 overflow-hidden animate-fade-up">
              {results.map((r) => (
                <Link
                  key={r.id}
                  to={`/producto/${r.slug}`}
                  onClick={() => setShowResults(false)}
                  data-testid={`search-result-${r.slug}`}
                  className="flex items-center gap-3 p-3 hover:bg-surface-soft"
                >
                  <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{r.name}</div>
                    <div className="text-xs text-ink-500 truncate">{r.brand} · {r.category}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatPrice(r.price)}</div>
                </Link>
              ))}
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1">
          <button
            data-testid="open-cart-btn"
            onClick={() => setOpen(true)}
            className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-surface-soft transition"
            aria-label="Carrito"
          >
            <ShoppingBag size={18} />
            {totalQty > 0 && (
              <span data-testid="cart-count-badge" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-ink-900 text-white rounded-full text-[10px] font-semibold grid place-items-center">
                {totalQty}
              </span>
            )}
          </button>

          {user && user !== false ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" className="w-10 h-10 grid place-items-center rounded-full hover:bg-surface-soft transition">
                  <User size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] rounded-2xl">
                <DropdownMenuLabel className="text-xs text-ink-500 font-medium">
                  {user.name}
                  <div className="text-[11px] text-ink-300 font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-profile" onClick={() => navigate("/perfil")}>
                  Mis pedidos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout" onClick={logout} className="text-red-600">
                  <LogOut size={14} className="mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              data-testid="login-btn"
              onClick={() => navigate("/login")}
              className="rounded-full bg-ink-900 hover:bg-ink-700 text-white h-9 px-5"
              size="sm"
            >
              Iniciar sesión
            </Button>
          )}

          <button
            className="md:hidden w-10 h-10 grid place-items-center rounded-full hover:bg-surface-soft"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            data-testid="mobile-menu-toggle"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line/60 bg-white">
          <div className="px-5 py-3 flex flex-col gap-1">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <Link
                key={key}
                to={meta.path}
                onClick={() => setMobileOpen(false)}
                data-testid={`mobile-nav-${key}`}
                className="px-3 py-2.5 rounded-xl text-sm text-ink-900 hover:bg-surface-soft"
              >
                {meta.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

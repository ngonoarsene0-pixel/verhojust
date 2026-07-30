import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Store,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { BUSINESS } from "../lib/db";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-primary-700" : "text-neutral-600 hover:text-neutral-900"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Top bar */}
      <div className="bg-primary-700 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="hidden sm:inline">Livraison à Yaoundé — Mfoundi Mall</span>
          <span className="font-medium">{BUSINESS.phone}</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-bold text-sm text-neutral-900 leading-tight">
                VERHOJUST
              </p>
              <p className="text-[10px] text-primary-600 font-semibold tracking-widest uppercase">
                ÉPICERIE
              </p>
            </div>
          </Link>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
              />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass} end>
              Accueil
            </NavLink>
            <NavLink to="/catalogue" className={navLinkClass}>
              Catalogue
            </NavLink>
            {user && (
              <NavLink to="/compte" className={navLinkClass}>
                Mes Commandes
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Administration
              </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/panier"
              className="relative p-2.5 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-neutral-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {user.client.prenomClient[0].toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">
                          {user.client.prenomClient} {user.client.nomClient}
                        </p>
                        <p className="text-xs text-neutral-500">{user.client.emailClient}</p>
                      </div>
                      <Link
                        to="/compte"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Package className="w-4 h-4" /> Mes Commandes
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Administration
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary !py-2 !px-4 hidden sm:inline-flex">
                <User className="w-4 h-4" /> Connexion
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-neutral-100"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none"
                />
              </div>
            </form>
            <NavLink to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">
              Accueil
            </NavLink>
            <NavLink to="/catalogue" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">
              Catalogue
            </NavLink>
            {user && (
              <NavLink to="/compte" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">
                Mes Commandes
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-neutral-700">
                Administration
              </NavLink>
            )}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

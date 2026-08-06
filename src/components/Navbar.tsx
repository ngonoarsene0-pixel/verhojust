import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  Package,
  Facebook,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

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
          <span className="hidden sm:inline">Livraison à Yaoundé et Douala</span>
          
          {/* Réseaux sociaux avec vraies couleurs sur pastilles blanches */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Facebook en bleu foncé */}
            <a
              href="https://www.facebook.com/RodeMF"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
            >
              <Facebook className="w-4 h-4 text-[#1877F2] fill-[#1877F2]" />
            </a>

            {/* TikTok en noir */}
            <a
              href="https://www.tiktok.com/@verhojust4?_r=1&_t=ZS-98eWvT2uNNc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
            >
              <svg className="w-4 h-4 text-black fill-black" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img 
              src="/images/IMG-20250822-WA0184.jpg" 
              alt="Verhojust Logo" 
              className="h-12 w-auto object-contain rounded-lg"
            />
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
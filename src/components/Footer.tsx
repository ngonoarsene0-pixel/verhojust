import { Link } from "react-router-dom";
import { Store, MapPin, Phone, Mail } from "lucide-react";
import { BUSINESS } from "../lib/db";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm">VERHOJUST</p>
                <p className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase">
                  ÉPICERIE
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {BUSINESS.tagline}. Votre épicerie de confiance pour des produits
              frais et de qualité.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Accueil</Link></li>
              <li><Link to="/catalogue" className="hover:text-primary-400 transition-colors">Catalogue</Link></li>
              <li><Link to="/panier" className="hover:text-primary-400 transition-colors">Panier</Link></li>
              <li><Link to="/compte" className="hover:text-primary-400 transition-colors">Mon Compte</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Catégories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalogue?type=1" className="hover:text-primary-400 transition-colors">Piments & Poivres</Link></li>
              <li><Link to="/catalogue?type=2" className="hover:text-primary-400 transition-colors">Épices & Graines</Link></li>
              <li><Link to="/catalogue?type=3" className="hover:text-primary-400 transition-colors">Herbes Aromatiques</Link></li>
              <li><Link to="/catalogue?type=4" className="hover:text-primary-400 transition-colors">Mélanges & Spécialités</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <span>{BUSINESS.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <span>{BUSINESS.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span>{BUSINESS.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} VERHOJUST ÉPICERIE. Tous droits réservés.
          </p>
          <p className="text-xs text-neutral-500">
            Conçu avec passion à Yaoundé, Cameroun.
          </p>
        </div>
      </div>
    </footer>
  );
}

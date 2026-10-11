import { Link } from "react-router-dom";
import { Store, MapPin, Phone, Mail } from "lucide-react";
import { BUSINESS } from "../lib/db";

interface FooterProps {
  currentLang?: "FR" | "EN";
}

export default function Footer({ currentLang = "FR" }: FooterProps) {
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
                  {currentLang === "FR" ? "ÉPICERIE" : "GROCERY STORE"}
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {BUSINESS.tagline}. {currentLang === "FR" 
                ? "Votre épicerie de confiance pour des produits frais et de qualité." 
                : "Your trusted grocery store for fresh and quality products."}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {currentLang === "FR" ? "Navigation" : "Navigation"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Accueil" : "Home"}
                </Link>
              </li>
              <li>
                <Link to="/catalogue" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Catalogue" : "Catalog"}
                </Link>
              </li>
              <li>
                <Link to="/panier" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Panier" : "Cart"}
                </Link>
              </li>
              <li>
                <Link to="/compte" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Mon Compte" : "My Account"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {currentLang === "FR" ? "Catégories" : "Categories"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalogue?type=1" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Piments & Poivres" : "Chilis & Peppers"}
                </Link>
              </li>
              <li>
                <Link to="/catalogue?type=2" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Épices & Graines" : "Spices & Seeds"}
                </Link>
              </li>
              <li>
                <Link to="/catalogue?type=3" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Herbes Aromatiques" : "Aromatic Herbs"}
                </Link>
              </li>
              <li>
                <Link to="/catalogue?type=4" className="hover:text-primary-400 transition-colors">
                  {currentLang === "FR" ? "Mélanges & Spécialités" : "Blends & Specialties"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {currentLang === "FR" ? "Contact" : "Contact"}
            </h4>
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
            © {new Date().getFullYear()} VERHOJUST {currentLang === "FR" ? "ÉPICERIE" : "GROCERY STORE"}. {currentLang === "FR" ? "Tous droits réservés." : "All rights reserved."}
          </p>
          <p className="text-xs text-neutral-500">
            {currentLang === "FR" ? "Conçu avec passion à Yaoundé, Cameroun." : "Crafted with passion in Yaounde, Cameroon."}
          </p>
        </div>
      </div>
    </footer>
  );
}
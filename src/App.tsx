import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import SupportChat from "./components/SupportChat";
import ScrollToTop from "./components/ScrollToTop";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const [lang, setLang] = useState<"FR" | "EN">("FR");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "FR" ? "EN" : "FR"));
  };

  // Données structurées Schema.org pour indiquer à Google que c'est une épicerie
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": "Verhojust",
    "url": "https://verhojust.com",
    "description": "Votre épicerie en ligne de confiance.",
    "currenciesAccepted": "EUR",
    "priceRange": "€"
  };

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Helmet>
          <title>Verhojust - Épicerie en ligne</title>
          <meta name="description" content="Commandez vos produits et articles du quotidien sur notre épicerie en ligne." />
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Helmet>
        <ScrollToTop />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar currentLang={lang} onToggleLanguage={toggleLanguage} />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage currentLang={lang} />} />
                    <Route path="/catalogue" element={<CatalogPage currentLang={lang} />} />
                    <Route path="/produit/:id" element={<ProductDetailPage currentLang={lang} />} />
                    <Route path="/login" element={<LoginPage currentLang={lang} />} />
                    <Route path="/signup" element={<SignupPage currentLang={lang} />} />
                    <Route path="/panier" element={<CartPage currentLang={lang} />} />
                    <Route path="/checkout" element={<CheckoutPage currentLang={lang} />} />
                    <Route
                      path="/compte"
                      element={
                        <ProtectedRoute>
                          <AccountPage currentLang={lang} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage currentLang={lang} />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </main>
                <WhatsAppButton />
                <SupportChat />
                <Footer currentLang={lang} />
              </div>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
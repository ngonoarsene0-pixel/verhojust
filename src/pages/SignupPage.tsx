import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

interface SignupPageProps {
  currentLang?: "FR" | "EN";
}

export default function SignupPage({ currentLang = "FR" }: SignupPageProps) {
  const { signup, loading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    prenomClient: "",
    nomClient: "",
    emailClient: "",
    telephoneClient: "",
    adresseClient: "",
    villeClient: "Yaoundé",
    motDePasse: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.motDePasse !== form.confirmPassword) {
      setError(
        currentLang === "FR"
          ? "Les mots de passe ne correspondent pas"
          : "Passwords do not match"
      );
      return;
    }
    if (form.motDePasse.length < 6) {
      setError(
        currentLang === "FR"
          ? "Le mot de passe doit contenir au moins 6 caractères"
          : "Password must be at least 6 characters"
      );
      return;
    }
    try {
      const u = await signup({
        nomClient: form.nomClient,
        prenomClient: form.prenomClient,
        emailClient: form.emailClient,
        telephoneClient: form.telephoneClient,
        adresseClient: form.adresseClient,
        villeClient: form.villeClient,
        motDePasse: form.motDePasse,
      });
      notify(
        currentLang === "FR"
          ? `Bienvenue, ${u.client.prenomClient}!`
          : `Welcome, ${u.client.prenomClient}!`
      );
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : currentLang === "FR"
          ? "Erreur lors de l'inscription"
          : "Error during registration"
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            {currentLang === "FR" ? "Créer un compte" : "Create an Account"}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {currentLang === "FR"
              ? "Rejoignez VERHOJUST ÉPICERIE pour commander en ligne"
              : "Join VERHOJUST GROCERY STORE to shop online"}
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Prénom" : "First Name"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    required
                    value={form.prenomClient}
                    onChange={(e) => update("prenomClient", e.target.value)}
                    placeholder="Aline"
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Nom" : "Last Name"}
                </label>
                <input
                  required
                  value={form.nomClient}
                  onChange={(e) => update("nomClient", e.target.value)}
                  placeholder="Nkomo"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">
                {currentLang === "FR" ? "Email" : "Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={form.emailClient}
                  onChange={(e) => update("emailClient", e.target.value)}
                  placeholder={currentLang === "FR" ? "votre@email.com" : "your@email.com"}
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">
                {currentLang === "FR" ? "Téléphone" : "Phone"}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  required
                  value={form.telephoneClient}
                  onChange={(e) => update("telephoneClient", e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">
                {currentLang === "FR" ? "Adresse" : "Address"}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  required
                  value={form.adresseClient}
                  onChange={(e) => update("adresseClient", e.target.value)}
                  placeholder={currentLang === "FR" ? "Quartier, rue..." : "Neighborhood, street..."}
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">
                {currentLang === "FR" ? "Ville" : "City"}
              </label>
              <input
                required
                value={form.villeClient}
                onChange={(e) => update("villeClient", e.target.value)}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Mot de passe" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={form.motDePasse}
                    onChange={(e) => update("motDePasse", e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Confirmer" : "Confirm"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {currentLang === "FR" ? "Créer mon compte" : "Create My Account"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          {currentLang === "FR" ? "Déjà un compte?" : "Already have an account?"}{" "}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
            {currentLang === "FR" ? "Se connecter" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
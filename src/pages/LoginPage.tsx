import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login(email, password);
      notify(`Bienvenue, ${u.client.prenomClient}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            Connexion
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Connectez-vous à votre compte VERHOJUST
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
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 text-center mb-3">
              Comptes de démonstration:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setEmail("admin@verhojust.cm");
                  setPassword("admin123");
                }}
                className="rounded-lg bg-neutral-50 border border-neutral-200 p-2 text-left hover:bg-neutral-100 transition-colors"
              >
                <p className="font-semibold text-neutral-700">Admin</p>
                <p className="text-neutral-500">admin@verhojust.cm</p>
              </button>
              <button
                onClick={() => {
                  setEmail("aline@example.com");
                  setPassword("client123");
                }}
                className="rounded-lg bg-neutral-50 border border-neutral-200 p-2 text-left hover:bg-neutral-100 transition-colors"
              >
                <p className="font-semibold text-neutral-700">Client</p>
                <p className="text-neutral-500">aline@example.com</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Pas encore de compte?{" "}
          <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

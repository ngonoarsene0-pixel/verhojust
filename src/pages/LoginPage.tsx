import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, Mail, Lock, ArrowRight, AlertCircle, KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../services/auth.service";

interface LoginPageProps {
  currentLang?: "FR" | "EN";
}

export default function LoginPage({ currentLang = "FR" }: LoginPageProps) {
  const { login, loading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // États pour la sécurité par code e-mail (OTP)
  const [step, setStep] = useState<"login" | "ask_email" | "verify_code" | "new_password">("login");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (step === "login") {
        // Connexion classique
        const u = await login(email, password);
        notify(
          currentLang === "FR"
            ? `Bienvenue, ${u.client.prenomClient}!`
            : `Welcome, ${u.client.prenomClient}!`
        );
        navigate(from, { replace: true });
      } 
      else if (step === "ask_email") {
        // Étape 1 : Demander l'envoi du code
        setActionLoading(true);
        const generatedCode = await authService.requestPasswordReset(email);
        setActionLoading(false);
        
        notify(
          currentLang === "FR"
            ? `Code de sécurité généré ! (Test : ${generatedCode})`
            : `Security code generated! (Test: ${generatedCode})`
        );
        setStep("verify_code");
      } 
      else if (step === "verify_code") {
        // Étape 2 : Juste valider que le code entré correspond
        if (!code) {
          setError(
            currentLang === "FR"
              ? "Veuillez entrer le code de sécurité"
              : "Please enter the security code"
          );
          return;
        }
        setStep("new_password");
      } 
      else if (step === "new_password") {
        // Étape 3 : Appliquer le nouveau mot de passe
        setActionLoading(true);
        await authService.verifyAndResetPassword(email, code, newPassword);
        setActionLoading(false);

        notify(
          currentLang === "FR"
            ? "Mot de passe modifié avec succès ! Vous pouvez vous connecter."
            : "Password changed successfully! You can now log in."
        );
        setStep("login");
        setPassword("");
        setNewPassword("");
        setCode("");
      }
    } catch (err) {
      setActionLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : currentLang === "FR"
          ? "Une erreur est survenue"
          : "An error occurred"
      );
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
            {step === "login" && (currentLang === "FR" ? "Connexion" : "Log In")}
            {step === "ask_email" && (currentLang === "FR" ? "Mot de passe oublié" : "Forgot Password")}
            {step === "verify_code" && (currentLang === "FR" ? "Vérification du code" : "Code Verification")}
            {step === "new_password" && (currentLang === "FR" ? "Nouveau mot de passe" : "New Password")}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {step === "login" &&
              (currentLang === "FR"
                ? "Connectez-vous à votre compte VERHOJUST"
                : "Log in to your VERHOJUST account")}
            {step === "ask_email" &&
              (currentLang === "FR"
                ? "Entrez votre e-mail pour recevoir votre code de sécurité"
                : "Enter your email to receive your security code")}
            {step === "verify_code" &&
              (currentLang === "FR"
                ? `Entrez le code à 6 chiffres envoyé à ${email}`
                : `Enter the 6-digit code sent to ${email}`)}
            {step === "new_password" &&
              (currentLang === "FR"
                ? "Choisissez votre nouveau mot de passe sécurisé"
                : "Choose your new secure password")}
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
            {/* Champ E-mail (utilisé au login et à l'étape ask_email) */}
            {(step === "login" || step === "ask_email") && (
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Email" : "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={currentLang === "FR" ? "votre@email.com" : "your@email.com"}
                    className="input pl-10"
                    disabled={step === "ask_email" && actionLoading}
                  />
                </div>
              </div>
            )}

            {/* Champ Mot de passe (uniquement au login) */}
            {step === "login" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">
                    {currentLang === "FR" ? "Mot de passe" : "Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("ask_email");
                      setError("");
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {currentLang === "FR" ? "Mot de passe oublié ?" : "Forgot password?"}
                  </button>
                </div>
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
            )}

            {/* Champ Code de sécurité (étape verify_code) */}
            {step === "verify_code" && (
              <div>
                <label className="label">
                  {currentLang === "FR"
                    ? "Code de sécurité à 6 chiffres"
                    : "6-digit security code"}
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="input pl-10 text-center tracking-widest text-lg font-bold"
                  />
                </div>
              </div>
            )}

            {/* Champ Nouveau mot de passe (étape new_password) */}
            {step === "new_password" && (
              <div>
                <label className="label">
                  {currentLang === "FR" ? "Nouveau mot de passe" : "New password"}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || actionLoading} className="btn-primary w-full">
              {loading || actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {step === "login" && (
                    <>
                      {currentLang === "FR" ? "Se connecter" : "Log In"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {step === "ask_email" && (
                    <>
                      {currentLang === "FR" ? "Envoyer le code" : "Send Code"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {step === "verify_code" && (
                    <>
                      {currentLang === "FR" ? "Vérifier le code" : "Verify Code"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {step === "new_password" && (
                    <>
                      {currentLang === "FR" ? "Enregistrer le mot de passe" : "Save Password"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </button>

            {/* Bouton retour en arrière si on est dans les étapes de réinitialisation */}
            {step !== "login" && (
              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setError("");
                }}
                className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-2 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />{" "}
                {currentLang === "FR" ? "Retour à la connexion" : "Back to login"}
              </button>
            )}
          </form>

          {step === "login" && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 text-center">
                {currentLang === "FR"
                  ? "Vos identifiants vous ont été envoyés lors de votre inscription."
                  : "Your credentials were sent to you during registration."}
              </p>
            </div>
          )}
        </div>

        {step === "login" && (
          <p className="text-center text-sm text-neutral-500 mt-6">
            {currentLang === "FR" ? "Pas encore de compte?" : "Don't have an account yet?"}{" "}
            <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">
              {currentLang === "FR" ? "Créer un compte" : "Create an account"}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
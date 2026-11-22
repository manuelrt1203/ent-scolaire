import { AuthLayout } from "../../components/AuthLayout";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, requestActivationCode, verifyActivationCode, setPassword } from "@ent/shared";
import { BackButton } from "../../components/ui/BackButton";

type Step = "email" | "code" | "password";

export function ActivationScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestActivationCode(client, email);
    } catch {
      // Message volontairement générique : ne pas révéler si l'email existe.
    } finally {
      setLoading(false);
      setInfo("Si un compte existe avec cet email, un code vient d'être envoyé.");
      setStep("code");
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyActivationCode(client, email, code);
      setInfo(null);
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await setPassword(client, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de définir le mot de passe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-midnight-ink">Première connexion</h1>
        <p className="mb-6 text-sm text-slate-500">
          {step === "email" && "Entrez l'email transmis par votre établissement."}
          {step === "code" && "Entrez le code reçu par email."}
          {step === "password" && "Choisissez votre mot de passe définitif."}
        </p>

        {info && <p className="mb-4 text-sm text-slate-600">{info}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {step === "email" && (
          <form onSubmit={handleRequestCode}>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ent-accent focus:outline-none focus:ring-1 focus:ring-ent-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ent-accent px-3 py-2 text-sm font-medium text-white hover:bg-ent-accent/90 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Recevoir mon code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode}>
            <BackButton onClick={() => setStep("email")} />
            <label className="mb-1 block text-sm font-medium text-slate-700">Code reçu par email</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              inputMode="numeric"
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest focus:border-ent-accent focus:outline-none focus:ring-1 focus:ring-ent-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ent-accent px-3 py-2 text-sm font-medium text-white hover:bg-ent-accent/90 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Valider le code"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleSetPassword}>
            <BackButton onClick={() => setStep("code")} />
            <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ent-accent focus:outline-none focus:ring-1 focus:ring-ent-accent"
            />
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ent-accent focus:outline-none focus:ring-1 focus:ring-ent-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ent-accent px-3 py-2 text-sm font-medium text-white hover:bg-ent-accent/90 disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : "Activer mon compte"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

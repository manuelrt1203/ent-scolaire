import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, requestActivationCode, verifyActivationCode, setPassword } from "@ent/shared";

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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Première connexion</h1>
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
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Recevoir mon code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode}>
            <label className="mb-1 block text-sm font-medium text-slate-700">Code reçu par email</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              inputMode="numeric"
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="mb-2 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Valider le code"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full rounded-md px-3 py-2 text-xs text-slate-500 hover:underline"
            >
              Renvoyer un code / changer d'email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleSetPassword}>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : "Activer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

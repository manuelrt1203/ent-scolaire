import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@ent/shared";

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">ENT Scolaire</h1>

        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-ink px-3 py-2 text-sm font-medium text-white hover:bg-indigo-ink/90 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/activation")}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:underline"
        >
          Première connexion ? Activer mon compte
        </button>

        <button
          type="button"
          onClick={() => navigate("/inscription")}
          className="mt-2 w-full text-center text-xs text-slate-500 hover:underline"
        >
          Nouvelle école ? Inscrire mon établissement
        </button>

        <button
          type="button"
          onClick={() => navigate("/invitation")}
          className="mt-2 w-full text-center text-xs text-slate-500 hover:underline"
        >
          J'ai un code d'invitation
        </button>
      </form>
    </div>
  );
}

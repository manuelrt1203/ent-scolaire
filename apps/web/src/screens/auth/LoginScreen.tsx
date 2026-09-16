import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { IconGraduationCap } from "../../components/icons";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-ink text-white">
          <IconGraduationCap className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold tracking-tight text-midnight-ink">ENT Scolaire</span>
      </Link>

      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">Connexion</h1>
        <p className="mb-6 text-sm text-slate-500">Accédez à votre espace direction, professeur, élève ou parent.</p>

        <div className="mb-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
        </div>

        <div className="mb-4">
          <Field label="Mot de passe">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Connexion…" : "Se connecter"}
        </Button>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-center">
          <button type="button" onClick={() => navigate("/activation")} className="text-xs text-slate-500 hover:text-indigo-ink hover:underline">
            Première connexion ? Activer mon compte
          </button>
          <button type="button" onClick={() => navigate("/invitation")} className="text-xs text-slate-500 hover:text-indigo-ink hover:underline">
            J'ai un code d'invitation
          </button>
          <button type="button" onClick={() => navigate("/inscription")} className="text-xs text-slate-500 hover:text-indigo-ink hover:underline">
            Nouvelle école ? Inscrire mon établissement
          </button>
        </div>
      </form>
    </div>
  );
}

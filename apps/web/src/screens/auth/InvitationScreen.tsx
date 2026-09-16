import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { redeemInvitation, useAuth } from "@ent/shared";

export function InvitationScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<{ email: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await redeemInvitation(client, { code: code.trim().toUpperCase(), nom, prenom, email });
      setSucces({ email: result.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide");
    } finally {
      setLoading(false);
    }
  }

  if (succes) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">Compte créé</h1>
          <p className="mb-4 text-sm text-slate-600">
            Activez-le maintenant via « Première connexion » avec <span className="font-medium">{succes.email}</span> :
            un code vous sera envoyé par email.
          </p>
          <button
            type="button"
            onClick={() => navigate("/activation")}
            className="w-full rounded-md bg-indigo-ink px-3 py-2 text-sm font-medium text-white hover:bg-indigo-ink/90"
          >
            Activer mon compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">J'ai un code d'invitation</h1>
        <p className="mb-6 text-xs text-slate-500">Le code vous a été transmis par votre établissement.</p>

        <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
        <input
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-ink px-3 py-2 text-sm font-medium text-white hover:bg-indigo-ink/90 disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:underline"
        >
          Retour à la connexion
        </button>
      </form>
    </div>
  );
}

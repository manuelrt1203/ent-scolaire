import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registerEtablissement, useAuth } from "@ent/shared";

export function InscriptionEtablissementScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [etablissementNom, setEtablissementNom] = useState("");
  const [etablissementAdresse, setEtablissementAdresse] = useState("");
  const [directionPrenom, setDirectionPrenom] = useState("");
  const [directionNom, setDirectionNom] = useState("");
  const [directionEmail, setDirectionEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<{ email: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await registerEtablissement(client, {
        etablissementNom,
        etablissementAdresse: etablissementAdresse || undefined,
        directionNom,
        directionPrenom,
        directionEmail,
      });
      setSucces({ email: result.directionEmail });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  if (succes) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">Établissement créé</h1>
          <p className="mb-4 text-sm text-slate-600">
            Votre compte direction a été créé pour <span className="font-medium">{succes.email}</span>. Activez-le
            maintenant via « Première connexion » : un code vous sera envoyé par email.
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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Inscrire mon établissement</h1>
        <p className="mb-6 text-xs text-slate-500">Créez votre école et votre premier compte direction.</p>

        <label className="mb-1 block text-sm font-medium text-slate-700">Nom de l'établissement</label>
        <input
          value={etablissementNom}
          onChange={(e) => setEtablissementNom(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Adresse (optionnel)</label>
        <input
          value={etablissementAdresse}
          onChange={(e) => setEtablissementAdresse(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        <div className="mb-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-medium uppercase text-slate-500">Compte direction</p>

          <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
          <input
            value={directionPrenom}
            onChange={(e) => setDirectionPrenom(e.target.value)}
            required
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
          <input
            value={directionNom}
            onChange={(e) => setDirectionNom(e.target.value)}
            required
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={directionEmail}
            onChange={(e) => setDirectionEmail(e.target.value)}
            required
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-ink px-3 py-2 text-sm font-medium text-white hover:bg-indigo-ink/90 disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon établissement"}
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

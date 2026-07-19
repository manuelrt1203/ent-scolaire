import { useRef, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie, useEnvoyerMessage, useUploadPieceJointe } from "@ent/shared";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function ComposeScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill =
    (location.state as { destinataireId?: string; sujet?: string; parentMessageId?: string } | null) ?? null;

  const usersQuery = useQuery({ queryKey: ["annuaire-messagerie"], queryFn: () => getAnnuaireMessagerie(client) });
  const envoyer = useEnvoyerMessage(client);
  const uploadPieceJointe = useUploadPieceJointe(client);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [destinataires, setDestinataires] = useState<string[]>(prefill?.destinataireId ? [prefill.destinataireId] : []);
  const [sujet, setSujet] = useState(prefill?.sujet ?? "");
  const [corps, setCorps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const autresUtilisateurs = usersQuery.data ?? [];

  function toggleDestinataire(id: string) {
    setDestinataires((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (destinataires.length === 0) {
      setError("Sélectionnez au moins un destinataire");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const messageId = await envoyer.mutateAsync({
        sujet,
        corps,
        destinataireIds: destinataires,
        parentMessageId: prefill?.parentMessageId,
      });
      const fichiers = Array.from(fileInputRef.current?.files ?? []);
      for (const file of fichiers) {
        await uploadPieceJointe.mutateAsync({ messageId, file });
      }
      navigate("../messagerie/envoyes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Nouveau message</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Destinataires</label>
          <div className="max-h-48 overflow-y-auto rounded-md border border-slate-300 p-2">
            {autresUtilisateurs.map((u) => (
              <label key={u.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={destinataires.includes(u.id)}
                  onChange={() => toggleDestinataire(u.id)}
                />
                {u.prenom} {u.nom} <span className="text-xs text-slate-400">({ROLE_LABELS[u.role]})</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Sujet</label>
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
          <textarea
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Pièces jointes (optionnel)</label>
          <input ref={fileInputRef} type="file" multiple className="w-full text-sm" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={envoiEnCours}
          className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {envoiEnCours ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

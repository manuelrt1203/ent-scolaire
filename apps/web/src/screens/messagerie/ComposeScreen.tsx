import { useRef, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie, useEnvoyerMessage, useUploadPieceJointe } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/Card";
import { Field, Input, Textarea } from "../../components/ui/Field";

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
      <PageHeader title="Nouveau message" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Destinataires">
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
        </Field>

        <Field label="Sujet">
          <Input value={sujet} onChange={(e) => setSujet(e.target.value)} required />
        </Field>

        <Field label="Message">
          <Textarea value={corps} onChange={(e) => setCorps(e.target.value)} rows={8} />
        </Field>

        <Field label="Pièces jointes (optionnel)">
          <input ref={fileInputRef} type="file" multiple className="w-full text-sm" />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={envoiEnCours}>{envoiEnCours ? "Envoi…" : "Envoyer"}</Button>
      </form>
    </div>
  );
}

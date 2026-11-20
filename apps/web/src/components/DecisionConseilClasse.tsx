import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enregistrerDecisionConseil, getDecisionConseil, useAuth } from "@ent/shared";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, Textarea } from "./ui/Field";

export function DecisionConseilClasse({ inscriptionId, periodeId, eleve, onFermer }: {
  inscriptionId: string;
  periodeId: string;
  eleve: string;
  onFermer: () => void;
}) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["decision-conseil", inscriptionId, periodeId];
  const decisionQuery = useQuery({
    queryKey,
    queryFn: () => getDecisionConseil(client, inscriptionId, periodeId),
  });
  const [saisie, setSaisie] = useState<string | null>(null);
  const decision = saisie ?? decisionQuery.data?.decision ?? "";
  const mutation = useMutation({
    mutationFn: (publiee: boolean) => enregistrerDecisionConseil(client, {
      inscription_id: inscriptionId, periode_id: periodeId, decision: decision.trim(), publiee,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setSaisie(null);
    },
  });

  const erreur = decisionQuery.error ?? mutation.error;
  const actif = decisionQuery.isSuccess && !mutation.isPending;

  return (
    <Card className="mb-4 space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Décision du conseil de classe — {eleve}</h2>
        <Button variant="ghost" onClick={onFermer} disabled={mutation.isPending}>Fermer</Button>
      </div>
      <Field label="Décision">
        <Textarea value={decision} onChange={(event) => setSaisie(event.target.value)} rows={3} maxLength={1000} disabled={!actif} />
      </Field>
      {decisionQuery.data && (
        <p className="text-xs text-slate-600">
          {decisionQuery.data.publiee ? "Publiée sur le bulletin" : "Brouillon réservé à la direction"}
        </p>
      )}
      {erreur && <p role="alert" className="text-sm text-red-700">{erreur.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => mutation.mutate(false)} disabled={!actif || !decision.trim()}>
          {decisionQuery.data?.publiee ? "Retirer du bulletin et garder en brouillon" : "Enregistrer le brouillon"}
        </Button>
        <Button onClick={() => mutation.mutate(true)} disabled={!actif || !decision.trim()}>
          Publier sur le bulletin
        </Button>
      </div>
    </Card>
  );
}

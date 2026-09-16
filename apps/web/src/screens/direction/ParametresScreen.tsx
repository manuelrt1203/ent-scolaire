import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getEtablissement, updateRetentionEtablissement } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";

export function ParametresScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();

  const etablissementQuery = useQuery({
    queryKey: ["etablissement", profile?.etablissement_id],
    queryFn: () => getEtablissement(client, profile!.etablissement_id),
    enabled: Boolean(profile?.etablissement_id),
  });

  const [retentionVieScolaire, setRetentionVieScolaire] = useState("36");
  const [retentionMessagerie, setRetentionMessagerie] = useState("36");

  useEffect(() => {
    if (etablissementQuery.data) {
      setRetentionVieScolaire(String(etablissementQuery.data.retention_vie_scolaire_mois));
      setRetentionMessagerie(String(etablissementQuery.data.retention_messagerie_mois));
    }
  }, [etablissementQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRetentionEtablissement(client, profile!.etablissement_id, {
        retention_vie_scolaire_mois: Number(retentionVieScolaire),
        retention_messagerie_mois: Number(retentionMessagerie),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["etablissement", profile?.etablissement_id] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Paramètres"
        description="Durée de conservation des données avant suppression automatique (RGPD). Voir legal/politique-confidentialite.md pour le détail."
      />

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-32">
            <Field label="Vie scolaire (absences, retards, sanctions) — en mois">
              <Input type="number" min="1" value={retentionVieScolaire} onChange={(e) => setRetentionVieScolaire(e.target.value)} required />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Messagerie interne — en mois">
              <Input type="number" min="1" value={retentionMessagerie} onChange={(e) => setRetentionMessagerie(e.target.value)} required />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateMutation.isPending || !etablissementQuery.data}>Enregistrer</Button>
            {updateMutation.isSuccess && <span className="text-xs text-emerald-700">Enregistré.</span>}
          </div>
        </form>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Une tâche automatique s'exécute chaque nuit et supprime définitivement les événements de vie
        scolaire et les messages plus anciens que les durées ci-dessus. Les notes et relevés ne sont
        jamais supprimés automatiquement.
      </p>
    </div>
  );
}

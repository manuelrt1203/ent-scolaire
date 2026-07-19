import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getEtablissement, updateRetentionEtablissement } from "@ent/shared";

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
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Paramètres</h1>
      <p className="mb-6 text-sm text-slate-500">
        Durée de conservation des données avant suppression automatique (RGPD). Voir{" "}
        <span className="font-medium">legal/politique-confidentialite.md</span> pour le détail.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Vie scolaire (absences, retards, sanctions) — en mois
          </label>
          <input
            type="number"
            min="1"
            value={retentionVieScolaire}
            onChange={(e) => setRetentionVieScolaire(e.target.value)}
            required
            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Messagerie interne — en mois</label>
          <input
            type="number"
            min="1"
            value={retentionMessagerie}
            onChange={(e) => setRetentionMessagerie(e.target.value)}
            required
            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={updateMutation.isPending || !etablissementQuery.data}
          className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
        {updateMutation.isSuccess && <span className="ml-3 text-xs text-emerald-700">Enregistré.</span>}
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Une tâche automatique s'exécute chaque nuit et supprime définitivement les événements de vie
        scolaire et les messages plus anciens que les durées ci-dessus. Les notes et relevés ne sont
        jamais supprimés automatiquement.
      </p>
    </div>
  );
}

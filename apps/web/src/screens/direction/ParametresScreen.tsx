import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getEtablissement, updateRetentionEtablissement, updateAcademieEtablissement, ACADEMIES } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

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
  const [academie, setAcademie] = useState("");

  useEffect(() => {
    if (etablissementQuery.data) {
      setRetentionVieScolaire(String(etablissementQuery.data.retention_vie_scolaire_mois));
      setRetentionMessagerie(String(etablissementQuery.data.retention_messagerie_mois));
      setAcademie(etablissementQuery.data.academie ?? "");
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

  const academieMutation = useMutation({
    mutationFn: () => updateAcademieEtablissement(client, profile!.etablissement_id, academie || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etablissement", profile?.etablissement_id] });
      queryClient.invalidateQueries({ queryKey: ["dates-officielles"] });
    },
  });

  function handleAcademieSubmit(e: FormEvent) {
    e.preventDefault();
    academieMutation.mutate();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Paramètres" description="Réglages de l'établissement." />

      <h2 className="mb-2 text-sm font-semibold text-slate-900">Académie</h2>
      <Card className="mb-8 p-4">
        <form onSubmit={handleAcademieSubmit} className="space-y-4">
          <div className="max-w-xs">
            <Field label="Académie de l'établissement">
              <Select value={academie} onChange={(e) => setAcademie(e.target.value)}>
                <option value="">Non renseignée</option>
                {ACADEMIES.map((a) => (
                  <option key={a.nom} value={a.nom}>
                    {a.nom} {a.zone.length === 1 ? `(zone ${a.zone})` : `(${a.zone})`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            Détermine les vacances scolaires affichées dans le calendrier de tous les utilisateurs
            (source : calendrier officiel de l'Éducation nationale).
          </p>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={academieMutation.isPending || !etablissementQuery.data}>Enregistrer</Button>
            {academieMutation.isSuccess && <span className="text-xs text-emerald-700">Enregistré.</span>}
          </div>
        </form>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-slate-900">Conservation des données (RGPD)</h2>

      <p className="mb-4 text-sm text-slate-500">
        Voir la{" "}
        <Link to="/politique-confidentialite" target="_blank" className="text-indigo-ink hover:underline">
          politique de confidentialité
        </Link>{" "}
        pour le détail des données collectées et des durées de conservation.
      </p>

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

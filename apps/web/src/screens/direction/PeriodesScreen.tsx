import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getAnneeScolaireActive,
  getPeriodes,
  createPeriode,
  updatePeriode,
  deletePeriode,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";

export function PeriodesScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [ordre, setOrdre] = useState("1");

  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile?.etablissement_id),
  });
  const periodesQuery = useQuery({ queryKey: ["periodes"], queryFn: () => getPeriodes(client) });

  const createMutation = useMutation({
    mutationFn: () =>
      createPeriode(client, {
        nom,
        date_debut: dateDebut,
        date_fin: dateFin,
        ordre: Number(ordre),
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePeriode(client, editingId as string, { nom, date_debut: dateDebut, date_fin: dateFin, ordre: Number(ordre) }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePeriode(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["periodes"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setDateDebut("");
    setDateFin("");
    setOrdre("1");
  }

  function handleEdit(p: { id: string; nom: string; date_debut: string; date_fin: string; ordre: number }) {
    setEditingId(p.id);
    setNom(p.nom);
    setDateDebut(p.date_debut);
    setDateFin(p.date_fin);
    setOrdre(String(p.ordre));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Périodes"
        description="Définissez les périodes sur lesquelles porteront les relevés de notes — trimestres, mais aussi des périodes plus fines si besoin (un examen de janvier, un contrôle de février...)."
      />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="col-span-2">
            <Field label="Nom">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Examen de janvier" />
            </Field>
          </div>
          <Field label="Date de début">
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
          </Field>
          <Field label="Date de fin">
            <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
          </Field>
          <div className="w-24">
            <Field label="Ordre d'affichage">
              <Input type="number" min="1" value={ordre} onChange={(e) => setOrdre(e.target.value)} required />
            </Field>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={isPending || !anneeQuery.data}>
              {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
            )}
            {!anneeQuery.data && !anneeQuery.isLoading && (
              <span className="text-xs text-amber-700">Aucune année scolaire active — créez-en une avant d'ajouter une période.</span>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {periodesQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Du</th>
                <th className="px-4 py-2">Au</th>
                <th className="px-4 py-2">Ordre</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodesQuery.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-slate-900">{p.nom}</td>
                  <td className="px-4 py-2 text-slate-500 tabular-nums">{p.date_debut}</td>
                  <td className="px-4 py-2 text-slate-500 tabular-nums">{p.date_fin}</td>
                  <td className="px-4 py-2 text-slate-500 tabular-nums">{p.ordre}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(p)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(p.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune période créée pour l'instant." />
        )}
      </Card>
    </div>
  );
}

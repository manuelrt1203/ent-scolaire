import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getUtilisateurs,
  getClasses,
  getInscriptions,
  createInscription,
  updateInscription,
  deleteInscription,
  getAnneeScolaireActive,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

export function InscriptionsScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eleveId, setEleveId] = useState("");
  const [classeId, setClasseId] = useState("");

  const elevesQuery = useQuery({ queryKey: ["utilisateurs", "eleve"], queryFn: () => getUtilisateurs(client, "eleve") });
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const inscriptionsQuery = useQuery({ queryKey: ["inscriptions"], queryFn: () => getInscriptions(client) });
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const createMutation = useMutation({
    mutationFn: () => createInscription(client, { eleve_id: eleveId, classe_id: classeId, annee_scolaire_id: anneeQuery.data!.id }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateInscription(client, editingId as string, { classe_id: classeId }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInscription(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inscriptions"] }),
  });

  function resetForm() {
    setEditingId(null);
    setEleveId("");
    setClasseId("");
  }

  function handleEdit(i: { id: string; eleve_id: string; classe_id: string }) {
    setEditingId(i.id);
    setEleveId(i.eleve_id);
    setClasseId(i.classe_id);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      if (!classeId) return;
      updateMutation.mutate();
      return;
    }
    if (!eleveId || !classeId || !anneeQuery.data) return;
    createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Inscriptions des élèves" description="Inscrire les élèves dans leurs classes." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Élève">
              <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required disabled={Boolean(editingId)}>
                <option value="">—</option>
                {elevesQuery.data?.map((el) => (
                  <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Classe">
              <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} required>
                <option value="">—</option>
                {classesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={isPending || (!editingId && !anneeQuery.data)}>
            {editingId ? "Enregistrer" : "Inscrire"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
          )}
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {inscriptionsQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Élève</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inscriptionsQuery.data.map((i: any) => (
                <tr key={i.id}>
                  <td className="px-4 py-2 text-slate-900">{i.profiles?.prenom} {i.profiles?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{classesQuery.data?.find((c) => c.id === i.classe_id)?.nom}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(i)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(i.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune inscription pour le moment." />
        )}
      </Card>
    </div>
  );
}

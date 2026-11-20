import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getMatieres,
  getMatiereClasses,
  createMatiereClasse,
  updateMatiereClasse,
  deleteMatiereClasse,
  getAnneeScolaireActive,
  libelleClasse,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

export function MatiereClasseScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classeId, setClasseId] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [coefficient, setCoefficient] = useState("1");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const matieresQuery = useQuery({ queryKey: ["matieres"], queryFn: () => getMatieres(client) });
  const mcQuery = useQuery({ queryKey: ["matiere-classes"], queryFn: () => getMatiereClasses(client) });
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createMatiereClasse(client, {
        classe_id: classeId,
        matiere_id: matiereId,
        coefficient: Number(coefficient),
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["matiere-classes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateMatiereClasse(client, editingId as string, { coefficient: Number(coefficient) }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["matiere-classes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMatiereClasse(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matiere-classes"] }),
  });

  function resetForm() {
    setEditingId(null);
    setClasseId("");
    setMatiereId("");
    setCoefficient("1");
  }

  function handleEdit(mc: { id: string; classe_id: string; matiere_id: string; coefficient: number }) {
    setEditingId(mc.id);
    setClasseId(mc.classe_id);
    setMatiereId(mc.matiere_id);
    setCoefficient(String(mc.coefficient));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate();
      return;
    }
    if (!classeId || !matiereId || !anneeQuery.data) return;
    createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Matières par classe" description="Associer matières, classes et coefficients." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Classe">
              <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} required disabled={Boolean(editingId)}>
                <option value="">—</option>
                {classesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>{libelleClasse(c)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Matière">
              <Select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} required disabled={Boolean(editingId)}>
                <option value="">—</option>
                {matieresQuery.data?.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="w-24">
            <Field label="Coeff.">
              <Input type="number" step="0.5" min="0" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" disabled={isPending || (!editingId && !anneeQuery.data)}>
            {editingId ? "Enregistrer" : "Associer"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
          )}
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {mcQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Coefficient</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mcQuery.data.map((mc: any) => (
                <tr key={mc.id}>
                  <td className="px-4 py-2 text-slate-900">{libelleClasse(mc.classes)}</td>
                  <td className="px-4 py-2 text-slate-500">{mc.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{mc.coefficient}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(mc)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(mc.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune association matière/classe pour le moment." />
        )}
      </Card>
    </div>
  );
}

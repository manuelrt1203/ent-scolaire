import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getMatieres, createMatiere, updateMatiere, deleteMatiere } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";

export function MatieresScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");

  const matieresQuery = useQuery({ queryKey: ["matieres"], queryFn: () => getMatieres(client) });

  const createMutation = useMutation({
    mutationFn: () => createMatiere(client, { nom, code: code || null, etablissement_id: profile!.etablissement_id }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateMatiere(client, editingId as string, { nom, code: code || null }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMatiere(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matieres"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setCode("");
  }

  function handleEdit(m: { id: string; nom: string; code: string | null }) {
    setEditingId(m.id);
    setNom(m.nom);
    setCode(m.code ?? "");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Matières" description="Gérer les matières enseignées." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Nom">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Mathématiques" />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH" />
            </Field>
          </div>
          <Button type="submit" disabled={isPending}>{editingId ? "Enregistrer" : "Ajouter"}</Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
          )}
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {matieresQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matieresQuery.data.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 text-slate-900">{m.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{m.code ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(m)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(m.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune matière créée pour le moment." />
        )}
      </Card>
    </div>
  );
}

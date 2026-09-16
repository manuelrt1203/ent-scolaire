import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, getLiensParentsEleves, createLienParentEleve, deleteLienParentEleve } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

export function LiensParentsElevesScreen() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [parentId, setParentId] = useState("");
  const [eleveId, setEleveId] = useState("");

  const parentsQuery = useQuery({ queryKey: ["utilisateurs", "parent"], queryFn: () => getUtilisateurs(client, "parent") });
  const elevesQuery = useQuery({ queryKey: ["utilisateurs", "eleve"], queryFn: () => getUtilisateurs(client, "eleve") });
  const liensQuery = useQuery({ queryKey: ["liens"], queryFn: () => getLiensParentsEleves(client) });

  const createMutation = useMutation({
    mutationFn: () => createLienParentEleve(client, parentId, eleveId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liens"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLienParentEleve(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liens"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!parentId || !eleveId) return;
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Liens parents ↔ élèves" description="Rattacher les comptes parents à leurs enfants." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Parent">
              <Select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
                <option value="">—</option>
                {parentsQuery.data?.map((p) => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Élève">
              <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
                <option value="">—</option>
                {elevesQuery.data?.map((el) => (
                  <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>Lier</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {liensQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Parent</th>
                <th className="px-4 py-2">Élève</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liensQuery.data.map((l: any) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-slate-900">{l.parent?.prenom} {l.parent?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{l.eleve?.prenom} {l.eleve?.nom}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="danger" onClick={() => deleteMutation.mutate(l.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun lien parent-élève pour le moment." />
        )}
      </Card>
    </div>
  );
}

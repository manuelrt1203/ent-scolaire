import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libelleClasse, useAuth, getUtilisateurs, getMatiereClasses, getAffectations, createAffectation, deleteAffectation } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

export function AffectationsScreen() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [professeurId, setProfesseurId] = useState("");
  const [matiereClasseId, setMatiereClasseId] = useState("");

  const profsQuery = useQuery({ queryKey: ["utilisateurs", "professeur"], queryFn: () => getUtilisateurs(client, "professeur") });
  const mcQuery = useQuery({ queryKey: ["matiere-classes"], queryFn: () => getMatiereClasses(client) });
  const affectationsQuery = useQuery({ queryKey: ["affectations"], queryFn: () => getAffectations(client) });

  const createMutation = useMutation({
    mutationFn: () => createAffectation(client, professeurId, matiereClasseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affectations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAffectation(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affectations"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!professeurId || !matiereClasseId) return;
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Affectations des professeurs" description="Affecter les professeurs aux matières/classes." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Professeur">
              <Select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required>
                <option value="">—</option>
                {profsQuery.data?.map((p) => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Matière / Classe">
              <Select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)} required>
                <option value="">—</option>
                {mcQuery.data?.map((mc: any) => (
                  <option key={mc.id} value={mc.id}>{mc.matieres?.nom} — {libelleClasse(mc.classes)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>Affecter</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        {affectationsQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Professeur</th>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affectationsQuery.data.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-slate-900">{a.profiles?.prenom} {a.profiles?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="danger" onClick={() => deleteMutation.mutate(a.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune affectation pour le moment." />
        )}
      </Card>
    </div>
  );
}

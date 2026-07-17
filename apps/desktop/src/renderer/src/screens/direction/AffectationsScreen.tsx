import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, getMatiereClasses, getAffectations, createAffectation, deleteAffectation } from "@ent/shared";

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
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Affectations des professeurs</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Professeur</label>
          <select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {profsQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Matière / Classe</label>
          <select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {mcQuery.data?.map((mc: any) => (
              <option key={mc.id} value={mc.id}>{mc.matieres?.nom} — {mc.classes?.nom}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Affecter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            {affectationsQuery.data?.map((a: any) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-slate-900">{a.profiles?.prenom} {a.profiles?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.matieres?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.classes?.nom}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => deleteMutation.mutate(a.id)} className="text-xs text-slate-400 hover:text-red-600">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

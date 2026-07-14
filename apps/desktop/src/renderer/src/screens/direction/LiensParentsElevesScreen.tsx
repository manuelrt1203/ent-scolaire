import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, getLiensParentsEleves, createLienParentEleve } from "@ent/shared";

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!parentId || !eleveId) return;
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Liens parents ↔ élèves</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Parent</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {parentsQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Élève</label>
          <select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {elevesQuery.data?.map((el) => (
              <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Lier
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Parent</th>
              <th className="px-4 py-2">Élève</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {liensQuery.data?.map((l: any) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-slate-900">{l.parent?.prenom} {l.parent?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{l.eleve?.prenom} {l.eleve?.nom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

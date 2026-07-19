import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getMatieres, createMatiere, updateMatiere, deleteMatiere } from "@ent/shared";

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
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Matières</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Mathématiques"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs font-medium text-slate-600">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MATH"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {editingId ? "Enregistrer" : "Ajouter"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="px-2 py-2 text-xs text-slate-500 hover:underline">
            Annuler
          </button>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matieresQuery.data?.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-slate-900">{m.nom}</td>
                <td className="px-4 py-2 text-slate-500">{m.code ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(m)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    Modifier
                  </button>
                  <button onClick={() => deleteMutation.mutate(m.id)} className="text-xs text-slate-400 hover:text-red-600">
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

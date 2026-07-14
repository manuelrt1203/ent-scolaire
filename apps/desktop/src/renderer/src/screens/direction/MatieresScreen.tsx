import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getMatieres, createMatiere } from "@ent/shared";

export function MatieresScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");

  const matieresQuery = useQuery({ queryKey: ["matieres"], queryFn: () => getMatieres(client) });

  const createMutation = useMutation({
    mutationFn: () => createMatiere(client, { nom, code: code || null, etablissement_id: profile!.etablissement_id }),
    onSuccess: () => {
      setNom("");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

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
          disabled={createMutation.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matieresQuery.data?.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-slate-900">{m.nom}</td>
                <td className="px-4 py-2 text-slate-500">{m.code ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

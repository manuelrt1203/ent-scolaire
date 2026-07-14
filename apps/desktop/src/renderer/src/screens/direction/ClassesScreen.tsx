import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getClasses, createClasse, getAnneeScolaireActive } from "@ent/shared";

export function ClassesScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createClasse(client, {
        nom,
        niveau: niveau || null,
        etablissement_id: profile!.etablissement_id,
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      setNom("");
      setNiveau("");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!anneeQuery.data) return;
    createMutation.mutate();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Classes</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Terminale A"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Niveau</label>
          <input
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            placeholder="Terminale"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !anneeQuery.data}
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
              <th className="px-4 py-2">Niveau</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesQuery.data?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-slate-900">{c.nom}</td>
                <td className="px-4 py-2 text-slate-500">{c.niveau ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

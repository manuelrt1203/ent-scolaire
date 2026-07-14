import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getMatieres,
  getMatiereClasses,
  createMatiereClasse,
  getAnneeScolaireActive,
} from "@ent/shared";

export function MatiereClasseScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
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
      setCoefficient("1");
      queryClient.invalidateQueries({ queryKey: ["matiere-classes"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!classeId || !matiereId || !anneeQuery.data) return;
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Matières par classe</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Classe</label>
          <select value={classeId} onChange={(e) => setClasseId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Matière</label>
          <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {matieresQuery.data?.map((m) => (
              <option key={m.id} value={m.id}>{m.nom}</option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="mb-1 block text-xs font-medium text-slate-600">Coeff.</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={coefficient}
            onChange={(e) => setCoefficient(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !anneeQuery.data}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Associer
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Classe</th>
              <th className="px-4 py-2">Matière</th>
              <th className="px-4 py-2">Coefficient</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mcQuery.data?.map((mc: any) => (
              <tr key={mc.id}>
                <td className="px-4 py-2 text-slate-900">{mc.classes?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{mc.matieres?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{mc.coefficient}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  createClasse,
  updateClasse,
  deleteClasse,
  getAnneeScolaireActive,
  CYCLE_LABELS,
  CYCLES_ORDRE,
  NIVEAUX_PAR_CYCLE,
  type CycleScolaire,
} from "@ent/shared";

export function ClassesScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [cycle, setCycle] = useState<CycleScolaire>("college");
  const [niveau, setNiveau] = useState(NIVEAUX_PAR_CYCLE.college[0]);

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
        cycle,
        niveau,
        etablissement_id: profile!.etablissement_id,
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateClasse(client, editingId as string, { nom, cycle, niveau }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClasse(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setCycle("college");
    setNiveau(NIVEAUX_PAR_CYCLE.college[0]);
  }

  function handleCycleChange(nouveauCycle: CycleScolaire) {
    setCycle(nouveauCycle);
    setNiveau(NIVEAUX_PAR_CYCLE[nouveauCycle][0]);
  }

  function handleEdit(c: { id: string; nom: string; cycle: CycleScolaire; niveau: string }) {
    setEditingId(c.id);
    setNom(c.nom);
    setCycle(c.cycle);
    setNiveau(c.niveau);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate();
    } else {
      if (!anneeQuery.data) return;
      createMutation.mutate();
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Classes</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Cycle</label>
          <select
            value={cycle}
            onChange={(e) => handleCycleChange(e.target.value as CycleScolaire)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CYCLES_ORDRE.map((c) => (
              <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Niveau</label>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {NIVEAUX_PAR_CYCLE[cycle].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Nom de la classe</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="A, Bilingue, Terminale A…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || (!editingId && !anneeQuery.data)}
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
              <th className="px-4 py-2">Cycle</th>
              <th className="px-4 py-2">Niveau</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesQuery.data?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-slate-900">{c.nom}</td>
                <td className="px-4 py-2 text-slate-500">{CYCLE_LABELS[c.cycle]}</td>
                <td className="px-4 py-2 text-slate-500">{c.niveau}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(c)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    Modifier
                  </button>
                  <button onClick={() => deleteMutation.mutate(c.id)} className="text-xs text-slate-400 hover:text-red-600">
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

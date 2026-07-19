import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getAnneeScolaireActive,
  getPeriodes,
  createPeriode,
  updatePeriode,
  deletePeriode,
} from "@ent/shared";

export function PeriodesScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [ordre, setOrdre] = useState("1");

  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile?.etablissement_id),
  });
  const periodesQuery = useQuery({ queryKey: ["periodes"], queryFn: () => getPeriodes(client) });

  const createMutation = useMutation({
    mutationFn: () =>
      createPeriode(client, {
        nom,
        date_debut: dateDebut,
        date_fin: dateFin,
        ordre: Number(ordre),
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePeriode(client, editingId as string, { nom, date_debut: dateDebut, date_fin: dateFin, ordre: Number(ordre) }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePeriode(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["periodes"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setDateDebut("");
    setDateFin("");
    setOrdre("1");
  }

  function handleEdit(p: { id: string; nom: string; date_debut: string; date_fin: string; ordre: number }) {
    setEditingId(p.id);
    setNom(p.nom);
    setDateDebut(p.date_debut);
    setDateFin(p.date_fin);
    setOrdre(String(p.ordre));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Périodes</h1>
      <p className="mb-6 text-sm text-slate-500">
        Définissez les périodes sur lesquelles porteront les relevés de notes — trimestres, mais aussi des
        périodes plus fines si besoin (un examen de janvier, un contrôle de février...).
      </p>

      <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Examen de janvier"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date de début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date de fin</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ordre d'affichage</label>
          <input
            type="number"
            min="1"
            value={ordre}
            onChange={(e) => setOrdre(e.target.value)}
            required
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !anneeQuery.data}
            className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-slate-500 hover:underline">
              Annuler
            </button>
          )}
          {!anneeQuery.data && !anneeQuery.isLoading && (
            <span className="text-xs text-amber-700">Aucune année scolaire active — créez-en une avant d'ajouter une période.</span>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Du</th>
              <th className="px-4 py-2">Au</th>
              <th className="px-4 py-2">Ordre</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periodesQuery.data?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-slate-900">{p.nom}</td>
                <td className="px-4 py-2 text-slate-500 tabular-nums">{p.date_debut}</td>
                <td className="px-4 py-2 text-slate-500 tabular-nums">{p.date_fin}</td>
                <td className="px-4 py-2 text-slate-500 tabular-nums">{p.ordre}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(p)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    Modifier
                  </button>
                  <button onClick={() => deleteMutation.mutate(p.id)} className="text-xs text-slate-400 hover:text-red-600">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {periodesQuery.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucune période créée pour l'instant.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

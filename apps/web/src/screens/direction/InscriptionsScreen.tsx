import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getUtilisateurs,
  getClasses,
  getInscriptions,
  createInscription,
  updateInscription,
  deleteInscription,
  getAnneeScolaireActive,
} from "@ent/shared";

export function InscriptionsScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eleveId, setEleveId] = useState("");
  const [classeId, setClasseId] = useState("");

  const elevesQuery = useQuery({ queryKey: ["utilisateurs", "eleve"], queryFn: () => getUtilisateurs(client, "eleve") });
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const inscriptionsQuery = useQuery({ queryKey: ["inscriptions"], queryFn: () => getInscriptions(client) });
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const createMutation = useMutation({
    mutationFn: () => createInscription(client, { eleve_id: eleveId, classe_id: classeId, annee_scolaire_id: anneeQuery.data!.id }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateInscription(client, editingId as string, { classe_id: classeId }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInscription(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inscriptions"] }),
  });

  function resetForm() {
    setEditingId(null);
    setEleveId("");
    setClasseId("");
  }

  function handleEdit(i: { id: string; eleve_id: string; classe_id: string }) {
    setEditingId(i.id);
    setEleveId(i.eleve_id);
    setClasseId(i.classe_id);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      if (!classeId) return;
      updateMutation.mutate();
      return;
    }
    if (!eleveId || !classeId || !anneeQuery.data) return;
    createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Inscriptions des élèves</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Élève</label>
          <select
            value={eleveId}
            onChange={(e) => setEleveId(e.target.value)}
            required
            disabled={Boolean(editingId)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          >
            <option value="">—</option>
            {elevesQuery.data?.map((el) => (
              <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Classe</label>
          <select value={classeId} onChange={(e) => setClasseId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isPending || (!editingId && !anneeQuery.data)} className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {editingId ? "Enregistrer" : "Inscrire"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="px-2 py-2 text-xs text-slate-500 hover:underline">
            Annuler
          </button>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Élève</th>
              <th className="px-4 py-2">Classe</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inscriptionsQuery.data?.map((i: any) => (
              <tr key={i.id}>
                <td className="px-4 py-2 text-slate-900">{i.profiles?.prenom} {i.profiles?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{classesQuery.data?.find((c) => c.id === i.classe_id)?.nom}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(i)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    Modifier
                  </button>
                  <button onClick={() => deleteMutation.mutate(i.id)} className="text-xs text-slate-400 hover:text-red-600">
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

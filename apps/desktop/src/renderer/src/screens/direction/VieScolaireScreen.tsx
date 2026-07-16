import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getInscriptions,
  useVieScolaireClasse,
  useCreateEvenementVieScolaire,
  useJustifierEvenement,
} from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const [classeId, setClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeId],
    queryFn: () => getInscriptions(client, classeId),
    enabled: Boolean(classeId),
  });
  const vieScolaireQuery = useVieScolaireClasse(client, classeId || null);
  const creerSanction = useCreateEvenementVieScolaire(client);
  const justifier = useJustifierEvenement(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eleveId || !classeId || !profile || !description.trim()) return;
    creerSanction.mutate(
      { eleve_id: eleveId, classe_id: classeId, type: "sanction", date, description, signale_par: profile.id },
      { onSuccess: () => setDescription("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Vie scolaire</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-600">Classe</label>
        <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">—</option>
          {classesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {classeId && (
        <>
          <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Élève</label>
              <select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {inscriptionsQuery.data?.map((i: any) => (
                  <option key={i.eleve_id} value={i.eleve_id}>{i.profiles?.prenom} {i.profiles?.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Sanction</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Avertissement, exclusion 1 jour…" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={creerSanction.isPending || !eleveId} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Enregistrer
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Élève</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Détail</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Justifié</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vieScolaireQuery.data?.map((v: any) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 text-slate-900">{v.profiles?.prenom} {v.profiles?.nom}</td>
                    <td className="px-4 py-2 text-slate-500 capitalize">{v.type}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {v.type === "sanction" ? v.description : v.type === "retard" && v.duree_minutes ? `${v.duree_minutes} min` : v.motif ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(v.date)}</td>
                    <td className="px-4 py-2 text-slate-500">{v.justifie ? "Oui" : "Non"}</td>
                    <td className="px-4 py-2 text-right">
                      {v.type !== "sanction" && !v.justifie && (
                        <button
                          onClick={() => justifier.mutate({ id: v.id, justifie: true, motif: "Justifié par la direction" })}
                          className="text-xs text-slate-400 hover:text-emerald-600"
                        >
                          Justifier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {vieScolaireQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun événement pour cette classe.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

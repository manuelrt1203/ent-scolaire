import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useMesAffectations, getInscriptions, useVieScolaireClasse, useCreateEvenementVieScolaire } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [type, setType] = useState<"absence" | "retard">("absence");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dureeMinutes, setDureeMinutes] = useState("15");

  const matiereClasseSelectionnee = affectationsQuery.data?.find((a: any) => a.matiere_classe_id === matiereClasseId);
  const classeId = matiereClasseSelectionnee?.matiere_classe?.classe_id ?? "";

  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeId],
    queryFn: () => getInscriptions(client, classeId),
    enabled: Boolean(classeId),
  });
  const vieScolaireQuery = useVieScolaireClasse(client, classeId || null);
  const creerEvenement = useCreateEvenementVieScolaire(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eleveId || !classeId || !profile) return;
    creerEvenement.mutate(
      {
        eleve_id: eleveId,
        classe_id: classeId,
        type,
        date,
        duree_minutes: type === "retard" ? Number(dureeMinutes) : null,
        signale_par: profile.id,
      },
      { onSuccess: () => setEleveId("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Vie scolaire</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-600">Matière / Classe</label>
        <select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">—</option>
          {affectationsQuery.data?.map((a: any) => (
            <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
              {a.matiere_classe.matieres?.nom} — {a.matiere_classe.classes?.nom}
            </option>
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as "absence" | "retard")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="absence">Absence</option>
                <option value="retard">Retard</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            {type === "retard" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Minutes</label>
                <input type="number" min="1" value={dureeMinutes} onChange={(e) => setDureeMinutes(e.target.value)} className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            )}
            <button type="submit" disabled={creerEvenement.isPending || !eleveId} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Signaler
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Élève</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Justifié</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vieScolaireQuery.data?.map((v: any) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 text-slate-900">{v.profiles?.prenom} {v.profiles?.nom}</td>
                    <td className="px-4 py-2 text-slate-500 capitalize">{v.type}{v.type === "retard" && v.duree_minutes ? ` (${v.duree_minutes} min)` : ""}</td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(v.date)}</td>
                    <td className="px-4 py-2 text-slate-500">{v.justifie ? "Oui" : "Non"}</td>
                  </tr>
                ))}
                {vieScolaireQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun événement pour cette classe.</td>
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

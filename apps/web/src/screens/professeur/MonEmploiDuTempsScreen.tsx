import { useAuth, useCreneaux } from "@ent/shared";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function MonEmploiDuTempsScreen() {
  const { client } = useAuth();
  const creneauxQuery = useCreneaux(client);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Mon emploi du temps</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Jour</th>
              <th className="px-4 py-2">Horaire</th>
              <th className="px-4 py-2">Matière</th>
              <th className="px-4 py-2">Classe</th>
              <th className="px-4 py-2">Salle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {creneauxQuery.data?.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                <td className="px-4 py-2 text-slate-500">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.matieres?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.classes?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
              </tr>
            ))}
            {creneauxQuery.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucun créneau renseigné.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

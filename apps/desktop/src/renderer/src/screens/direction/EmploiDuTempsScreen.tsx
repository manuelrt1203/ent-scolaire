import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getMatiereClasses, getAffectations, useCreneaux, useCreateCreneau, useDeleteCreneau } from "@ent/shared";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client } = useAuth();
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [professeurId, setProfesseurId] = useState("");
  const [jourSemaine, setJourSemaine] = useState("1");
  const [heureDebut, setHeureDebut] = useState("08:00");
  const [heureFin, setHeureFin] = useState("09:00");
  const [salle, setSalle] = useState("");

  const mcQuery = useQuery({ queryKey: ["matiere-classes"], queryFn: () => getMatiereClasses(client) });
  const affectationsQuery = useQuery({ queryKey: ["affectations"], queryFn: () => getAffectations(client) });
  const creneauxQuery = useCreneaux(client, matiereClasseId || undefined);
  const createCreneau = useCreateCreneau(client);
  const deleteCreneau = useDeleteCreneau(client);

  const profsDisponibles = (affectationsQuery.data ?? []).filter((a: any) => a.matiere_classe_id === matiereClasseId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matiereClasseId || !professeurId) return;
    createCreneau.mutate(
      {
        matiere_classe_id: matiereClasseId,
        professeur_id: professeurId,
        jour_semaine: Number(jourSemaine),
        heure_debut: heureDebut,
        heure_fin: heureFin,
        salle: salle || null,
      },
      { onSuccess: () => setSalle("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Emploi du temps</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-600">Matière / Classe</label>
        <select
          value={matiereClasseId}
          onChange={(e) => {
            setMatiereClasseId(e.target.value);
            setProfesseurId("");
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {mcQuery.data?.map((mc: any) => (
            <option key={mc.id} value={mc.id}>{mc.matieres?.nom} — {mc.classes?.nom}</option>
          ))}
        </select>
      </div>

      {matiereClasseId && (
        <>
          <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Professeur</label>
              <select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {profsDisponibles.map((a: any) => (
                  <option key={a.professeur_id} value={a.professeur_id}>{a.profiles?.prenom} {a.profiles?.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Jour</label>
              <select value={jourSemaine} onChange={(e) => setJourSemaine(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                {JOURS.map((j, i) => (
                  <option key={j} value={i + 1}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Début</label>
              <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fin</label>
              <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Salle</label>
              <input value={salle} onChange={(e) => setSalle(e.target.value)} placeholder="B12" className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={createCreneau.isPending || !professeurId} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Ajouter
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Jour</th>
                  <th className="px-4 py-2">Horaire</th>
                  <th className="px-4 py-2">Professeur</th>
                  <th className="px-4 py-2">Salle</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creneauxQuery.data?.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                    <td className="px-4 py-2 text-slate-500">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                    <td className="px-4 py-2 text-slate-500">{c.professeur?.prenom} {c.professeur?.nom}</td>
                    <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => deleteCreneau.mutate(c.id)} className="text-xs text-slate-400 hover:text-red-600">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {creneauxQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucun créneau pour cette matière/classe.</td>
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

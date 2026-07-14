import { useMemo, useState } from "react";
import {
  useAuth,
  useMesAffectations,
  usePeriodes,
  useReleve,
  useNotesForReleve,
  useUpdateNoteValeur,
  useSoumettreReleve,
  getStatutLabel,
} from "@ent/shared";

export function SaisieNotesScreen() {
  const { client } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const periodesQuery = usePeriodes(client);

  const [matiereClasseId, setMatiereClasseId] = useState<string>("");
  const [periodeId, setPeriodeId] = useState<string>("");

  const releveQuery = useReleve(client, matiereClasseId || null, periodeId || null);
  const releve = releveQuery.data;
  const notesQuery = useNotesForReleve(client, releve?.id ?? null);
  const updateNote = useUpdateNoteValeur(client, releve?.id ?? null);
  const soumettre = useSoumettreReleve(client);

  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  const notes = notesQuery.data ?? [];
  const isBrouillon = releve?.statut === "brouillon";
  const toutesRemplies = useMemo(
    () => notes.length > 0 && notes.every((n: any) => (valeurs[n.id] ?? n.valeur ?? "") !== ""),
    [notes, valeurs],
  );

  function handleBlur(noteId: string, raw: string) {
    const trimmed = raw.trim();
    const valeur = trimmed === "" ? null : Number(trimmed);
    if (valeur !== null && (Number.isNaN(valeur) || valeur < 0 || valeur > 20)) return;
    updateNote.mutate({ noteId, valeur });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Saisie des notes</h1>

      <div className="mb-6 flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Matière / Classe</label>
          <select
            value={matiereClasseId}
            onChange={(e) => setMatiereClasseId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {affectationsQuery.data?.map((a: any) => (
              <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
                {a.matiere_classe.matieres?.nom} — {a.matiere_classe.classes?.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Période</label>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {periodesQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {releve && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Statut : {getStatutLabel(releve.statut)}
            </span>
            {releve.commentaire_direction && (
              <span className="text-xs text-amber-700">Commentaire direction : {releve.commentaire_direction}</span>
            )}
          </div>

          <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Élève</th>
                  <th className="px-4 py-2">Note / 20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.map((n: any) => (
                  <tr key={n.id}>
                    <td className="px-4 py-2 text-slate-900">{n.profiles?.prenom} {n.profiles?.nom}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        disabled={!isBrouillon}
                        defaultValue={n.valeur ?? ""}
                        onBlur={(e) => handleBlur(n.id, e.target.value)}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isBrouillon && (
            <button
              onClick={() => soumettre.mutate(releve.id)}
              disabled={!toutesRemplies || soumettre.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Soumettre à la direction
            </button>
          )}
          {!toutesRemplies && isBrouillon && (
            <p className="mt-2 text-xs text-slate-500">Toutes les notes doivent être renseignées avant soumission.</p>
          )}
        </>
      )}
    </div>
  );
}

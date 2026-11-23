import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { aDesEvaluationsLycee, EvaluationsLycee } from "../../components/EvaluationsLycee";
import {
  useAuth,
  useEtablissementCalendrier,
  useMesAffectations,
  usePeriodes,
  useReleve,
  useRelevesRenvoyes,
  useNotesForReleve,
  useUpdateNoteValeur,
  useSoumettreReleve,
  getStatutLabel,
  libelleClasse,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

export function SaisieNotesScreen() {
  const { client, profile } = useAuth();
  const { reglages, charge } = useEtablissementCalendrier(client, profile);
  const affectationsQuery = useMesAffectations(client);
  const periodesQuery = usePeriodes(client);

  const [matiereClasseId, setMatiereClasseId] = useState<string>("");
  const [periodeId, setPeriodeId] = useState<string>("");

  const affectations = (affectationsQuery.data ?? []).flatMap((affectation) =>
    affectation.professeur_id === profile?.id && affectation.matiere_classe ? [affectation.matiere_classe] : []
  );
  const renvoyes = useRelevesRenvoyes(client, profile?.id, affectations.map(({ id }) => id).sort());
  const matiereClasse = affectations.find(({ id }) => id === matiereClasseId);
  const periodes = (periodesQuery.data ?? []).filter(({ annee_scolaire_id }) =>
    annee_scolaire_id === matiereClasse?.annee_scolaire_id
  );
  const periode = periodes.find(({ id }) => id === periodeId);
  const corrections = (renvoyes.data ?? []).flatMap((releve) => {
    const matiere = affectations.find(({ id }) => id === releve.matiere_classe_id);
    const periode = periodesQuery.data?.find(({ id }) => id === releve.periode_id);
    return matiere && periode && matiere.annee_scolaire_id === periode.annee_scolaire_id && releve.commentaire_direction?.trim()
      ? [{ releve, matiere, periode }]
      : [];
  });

  const releveQuery = useReleve(client, matiereClasse?.id ?? null, periode?.id ?? null);
  const releve = releveQuery.data;
  const notesQuery = useNotesForReleve(client, releve?.id ?? null);
  const updateNote = useUpdateNoteValeur(client, releve?.id ?? null);
  const soumettre = useSoumettreReleve(client);

  const enregistrementNotes = useIsMutating({ mutationKey: ["modifier-note", releve?.id] }) > 0;
  const enregistrementEvaluations = useIsMutating({ mutationKey: ["evaluations-lycee", releve?.id] }) > 0;
  const notes = notesQuery.data ?? [];
  const isBrouillon = releve?.statut === "brouillon";
  const classe = matiereClasse?.classes;
  const evaluationsLycee = (reglages.evaluationsLyceePilote && classe?.cycle === "lycee") || notes.some(aDesEvaluationsLycee);
  const toutesRemplies = notes.length > 0 && notes.every((note) => note.valeur !== null);
  const erreur = releveQuery.error ?? notesQuery.error ?? updateNote.error ?? soumettre.error;

  function handleBlur(noteId: string, raw: string) {
    const trimmed = raw.trim();
    const valeur = trimmed === "" ? null : Number(trimmed);
    if (valeur !== null && (Number.isNaN(valeur) || valeur < 0 || valeur > 20)) return;
    if (notes.find((note) => note.id === noteId)?.valeur !== valeur) updateNote.mutate({ noteId, valeur });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Saisie des notes" description="Saisir et soumettre les notes de vos élèves." />

      {renvoyes.isError && (
        <p role="alert" className="mb-4 text-sm text-red-700">Impossible de charger les relevés à corriger.</p>
      )}
      {corrections.length > 0 && (
        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-lg font-semibold">Relevés à corriger</h2>
          <ul className="divide-y divide-slate-200">
            {corrections.map(({ releve, matiere, periode }) => (
              <li key={releve.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{matiere.matieres?.nom} — {libelleClasse(matiere.classes)}</p>
                  <p className="text-sm text-slate-600">{periode.nom}</p>
                </div>
                <Button onClick={() => {
                  setMatiereClasseId(matiere.id);
                  setPeriodeId(periode.id);
                }}>Corriger</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="flex-1">
          <Field label="Matière / Classe">
            <Select aria-label="Matière / Classe" value={matiereClasse?.id ?? ""} onChange={(e) => {
              setMatiereClasseId(e.target.value);
              setPeriodeId("");
            }}>
              <option value="">—</option>
              {affectations.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.matieres?.nom} — {libelleClasse(matiere.classes)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Période">
            <Select aria-label="Période" disabled={!matiereClasse} value={periode?.id ?? ""} onChange={(e) => setPeriodeId(e.target.value)}>
              <option value="">—</option>
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {erreur && <p role="alert" className="mb-4 text-sm text-red-700">{erreur.message}</p>}
      {releve && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Statut : {getStatutLabel(releve.statut)}
            </span>
          </div>

          {releve.commentaire_direction?.trim() && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <h2 className="font-semibold">{isBrouillon ? "Relevé renvoyé par la direction" : "Commentaire de la direction"}</h2>
              <p className="mt-1 whitespace-pre-wrap break-words">{releve.commentaire_direction}</p>
              {isBrouillon && <p className="mt-2">Corrigez les notes, puis soumettez à nouveau le relevé.</p>}
            </div>
          )}

          {evaluationsLycee && (
            <p className="mb-3 text-sm text-slate-600">
              Barème pilote sur 20. La moyenne des trois devoirs et la composition comptent chacune pour moitié.
            </p>
          )}
          <Card className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Élève</th>
                  {evaluationsLycee && <th className="px-4 py-2">Évaluations sur 20</th>}
                  <th className="px-4 py-2">Note / 20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.map((n) => {
                  const detaillee = aDesEvaluationsLycee(n) || (evaluationsLycee && isBrouillon && n.valeur === null);
                  return (
                  <tr key={n.id}>
                    <td className="px-4 py-2 text-slate-900">{n.profiles?.prenom} {n.profiles?.nom}</td>
                    {evaluationsLycee && (
                      <td className="px-4 py-2">
                        {detaillee && <EvaluationsLycee key={n.updated_at} note={n} editable={isBrouillon} disabled={soumettre.isPending} />}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      {detaillee ? (n.valeur ?? "—") : <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        disabled={!charge || !isBrouillon || soumettre.isPending}
                        defaultValue={n.valeur ?? ""}
                        onBlur={(e) => handleBlur(n.id, e.target.value)}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                      />}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {isBrouillon && (
            <Button onClick={() => soumettre.mutate(releve.id)} disabled={!charge || !toutesRemplies || soumettre.isPending || enregistrementNotes || enregistrementEvaluations}>
              {releve.commentaire_direction?.trim() ? "Soumettre à nouveau" : "Soumettre à la direction"}
            </Button>
          )}
          {!toutesRemplies && isBrouillon && (
            <p className="mt-2 text-xs text-slate-500">Toutes les notes doivent être renseignées avant soumission.</p>
          )}
        </>
      )}
    </div>
  );
}

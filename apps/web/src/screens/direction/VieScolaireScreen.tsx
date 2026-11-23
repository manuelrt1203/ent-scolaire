import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getInscriptions,
  useVieScolaireClasse,
  useCreateEvenementVieScolaire,
  useJustifierEvenement,
  useExaminerJustificatif,
  getJustificatifSignedUrl,
  libelleClasse,
} from "@ent/shared";
import { statutJustificatif, LIBELLES_JUSTIFICATIF } from "../../lib/statutJustificatif";
import { SuiviAppelsClasse } from "../../components/SuiviAppelsClasse";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const [filtres, setFiltres] = useSearchParams();
  const [eleveId, setEleveId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const piecesSeulement = filtres.get("justificatifs") === "attente";
  const dateAppel = filtres.get("date-appel");
  const creneauId = filtres.get("creneau");
  const seance = !piecesSeulement && creneauId && dateAppel && /^\d{4}-\d{2}-\d{2}$/.test(dateAppel)
    ? { creneauId, date: dateAppel }
    : undefined;
  const [erreurLecture, setErreurLecture] = useState("");
  const titreSeance = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (creneauId && dateAppel) titreSeance.current?.focus();
  }, [creneauId, dateAppel]);

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const classeSelectionnee = classesQuery.data?.find(({ id }) => id === filtres.get("classe"));
  const classeId = classeSelectionnee?.id ?? "";
  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeId],
    queryFn: () => getInscriptions(client, classeId),
    enabled: Boolean(classeId),
  });
  const vieScolaireQuery = useVieScolaireClasse(client, classeId || null, seance);
  const creerSanction = useCreateEvenementVieScolaire(client);
  const justifier = useJustifierEvenement(client);
  const examiner = useExaminerJustificatif(client);

  const evenements = vieScolaireQuery.data ?? [];
  const aExaminer = evenements.filter((evenement) => statutJustificatif(evenement) === "a_examiner");
  const affiches = piecesSeulement ? aExaminer : evenements;

  async function handleVoirJustificatif(chemin: string) {
    setErreurLecture("");
    try {
      const url = await getJustificatifSignedUrl(client, chemin);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setErreurLecture("Impossible d’ouvrir le justificatif.");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inscriptionsQuery.data?.some((inscription) => inscription.eleve_id === eleveId) || !classeId || !profile || !description.trim()) return;
    creerSanction.mutate(
      { eleve_id: eleveId, classe_id: classeId, type: "sanction", date, description, signale_par: profile.id },
      { onSuccess: () => setDescription("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Vie scolaire" description="Absences, retards et sanctions." />

      <Card className="mb-6 p-4">
        <Field label="Classe">
          <Select aria-label="Classe" value={classeId} onChange={(e) => {
            const suivants = new URLSearchParams();
            if (e.target.value) suivants.set("classe", e.target.value);
            if (dateAppel) suivants.set("date-appel", dateAppel);
            setFiltres(suivants, { replace: true });
            setEleveId("");
            setErreurLecture("");
          }}>
            <option value="">—</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{libelleClasse(c)}</option>
            ))}
          </Select>
        </Field>
      </Card>

      {classeId && (
        <>
          {classeSelectionnee && !piecesSeulement && (
            <SuiviAppelsClasse classeId={classeSelectionnee.id} anneeId={classeSelectionnee.annee_scolaire_id} />
          )}
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <Field label="Élève">
                  <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
                    <option value="">—</option>
                    {inscriptionsQuery.data?.map((i) => (
                      <option key={i.eleve_id} value={i.eleve_id}>{i.profiles?.prenom} {i.profiles?.nom}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Sanction">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Avertissement, exclusion 1 jour…" required />
                </Field>
              </div>
              <Button type="submit" disabled={creerSanction.isPending || !eleveId}>Enregistrer</Button>
            </form>
          </Card>

          {seance && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 ref={titreSeance} tabIndex={-1} className="text-lg font-semibold">Signalements de la séance</h2>
                <p className="text-sm text-slate-600">{formatDate(seance.date)}</p>
              </div>
              <Button variant="secondary" onClick={() => {
                const suivants = new URLSearchParams(filtres);
                suivants.delete("creneau");
                setFiltres(suivants);
              }}>Voir tous les événements</Button>
            </div>
          )}
          {!seance && vieScolaireQuery.isSuccess && (
            <label className="mb-4 flex w-fit items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={piecesSeulement} onChange={(e) => setFiltres(e.target.checked ? { classe: classeId, justificatifs: "attente" } : { classe: classeId }, { replace: true })} />
              Justificatifs à examiner ({aExaminer.length})
            </label>
          )}
          {(examiner.isError || justifier.isError || creerSanction.isError || erreurLecture) && (
            <p role="alert" className="mb-4 text-sm text-red-700">{erreurLecture || examiner.error?.message || "Impossible d’enregistrer la modification."}</p>
          )}
          <Card className="overflow-x-auto">
            {vieScolaireQuery.isError ? (
              <p role="alert" className="p-4 text-sm text-red-700">Impossible de charger la vie scolaire de cette classe.</p>
            ) : vieScolaireQuery.isPending ? (
              <p role="status" className="p-4 text-sm text-slate-600">Chargement…</p>
            ) : affiches.length ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Élève</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Détail</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Justification</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affiches.map((v) => {
                    const statut = statutJustificatif(v);
                    const chemin = v.justificatif_chemin;
                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-2 text-slate-900">{v.profiles?.prenom} {v.profiles?.nom}</td>
                        <td className="px-4 py-2 text-slate-500 capitalize">{v.type}</td>
                        <td className="px-4 py-2 text-slate-500">
                          {v.type === "sanction" ? v.description : v.type === "retard" && v.duree_minutes ? `${v.duree_minutes} min` : v.motif ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{formatDate(v.date)}</td>
                        <td className="px-4 py-2 text-slate-500">
                          {statut ? LIBELLES_JUSTIFICATIF[statut] : "—"}
                          {v.justificatif_motif_refus && <p className="mt-1 break-words text-xs">{v.justificatif_motif_refus}</p>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {chemin && (
                            <Button variant="ghost" className="mr-3" onClick={() => handleVoirJustificatif(chemin)}>
                              Justificatif
                            </Button>
                          )}
                          {chemin && statut === "a_examiner" && (
                            <div className="mt-2 flex flex-col items-end gap-2">
                              <Button
                                variant="success"
                                disabled={examiner.isPending}
                                onClick={() => examiner.mutate({ id: v.id, chemin, motifRefus: null })}
                              >
                                Valider le justificatif
                              </Button>
                              <details className="text-left">
                                <summary className="cursor-pointer text-sm font-medium text-red-700">Refuser le justificatif</summary>
                                <form className="mt-2 space-y-2" onSubmit={(event) => {
                                  event.preventDefault();
                                  const motifRefus = String(new FormData(event.currentTarget).get("motif") ?? "").trim();
                                  if (motifRefus) examiner.mutate({ id: v.id, chemin, motifRefus });
                                }}>
                                  <Input name="motif" aria-label="Motif du refus" placeholder="Motif du refus" required />
                                  <Button type="submit" variant="danger-outline" disabled={examiner.isPending}>Confirmer le refus</Button>
                                </form>
                              </details>
                            </div>
                          )}
                          {statut === "a_justifier" && (
                            <Button
                              variant="ghost"
                              className="hover:text-emerald-600"
                              disabled={justifier.isPending}
                              onClick={() => justifier.mutate({ id: v.id, justifie: true, motif: v.motif ?? "Justifié par la direction" })}
                            >
                              Justifier
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState message={seance ? "Aucune absence ni aucun retard pour cette séance." : piecesSeulement ? "Aucun justificatif à examiner pour cette classe." : "Aucun événement pour cette classe."} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getUtilisateurs,
  getClasses,
  getInscriptions,
  getInscriptionsClasseAnnee,
  createInscription,
  updateInscription,
  deleteInscription,
  getAnneeScolaireActive,
  getAnneesScolaires,
  getBulletin,
  getDetailsBulletin,
  getDecisionConseilPubliee,
  getEtablissement,
  buildBulletinHtml,
  buildBulletinsHtml,
  type BulletinHtmlInput,
  usePeriodes,
  useEtablissementCalendrier,
  getRemisesBulletins,
  enregistrerRemiseBulletin,
  annulerRemiseBulletin,
  libelleClasse,
} from "@ent/shared";
import { construireResultatsCsv } from "../../lib/exportResultatsCsv";
import { telechargerFichierTexte } from "../../lib/telechargerFichier";
import { ImportInscriptions } from "../../components/ImportInscriptions";
import { DecisionConseilClasse } from "../../components/DecisionConseilClasse";
import { imprimerBulletin } from "../../components/imprimerBulletin";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

const dateBrazzaville = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Africa/Brazzaville", year: "numeric", month: "2-digit", day: "2-digit",
});
const dateFr = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Brazzaville", dateStyle: "short" });

export function InscriptionsScreen() {
  const { client, profile } = useAuth();
  const { reglages } = useEtablissementCalendrier(client, profile);
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<{ id: string; anneeId: string } | null>(null);
  const editingId = edition?.id ?? null;
  const [eleveId, setEleveId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [filtreClasseId, setFiltreClasseId] = useState("");
  const [decisionInscriptionId, setDecisionInscriptionId] = useState<string | null>(null);
  const [periodeBulletinId, setPeriodeBulletinId] = useState("");
  const [classeBulletinId, setClasseBulletinId] = useState("");
  const [bilanImpression, setBilanImpression] = useState("");
  const [impressionEnCours, setImpressionEnCours] = useState(false);
  const [erreurBulletin, setErreurBulletin] = useState("");
  const periodesQuery = usePeriodes(client);

  const elevesQuery = useQuery({ queryKey: ["utilisateurs", "eleve"], queryFn: () => getUtilisateurs(client, "eleve") });
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const classeFiltre = classesQuery.data?.find((classe) => classe.id === filtreClasseId);
  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeFiltre?.id ?? null, classeFiltre?.annee_scolaire_id ?? null],
    queryFn: () => classeFiltre
      ? getInscriptionsClasseAnnee(client, classeFiltre.id, classeFiltre.annee_scolaire_id)
      : getInscriptions(client),
  });
  const anneesQuery = useQuery({
    queryKey: ["annees-scolaires", profile?.etablissement_id],
    queryFn: () => getAnneesScolaires(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });
  const annees = new Map(anneesQuery.data?.map((annee) => [annee.id, annee.libelle]));
  const comparaison = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
  const inscriptionsAffichees = classeFiltre
    ? [...(inscriptionsQuery.data ?? [])].sort((a, b) =>
        comparaison.compare(a.profiles?.nom ?? "", b.profiles?.nom ?? "")
        || comparaison.compare(a.profiles?.prenom ?? "", b.profiles?.prenom ?? ""))
    : inscriptionsQuery.data ?? [];
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
    setEdition(null);
    setEleveId("");
    setClasseId("");
  }

  function handleEdit(i: { id: string; eleve_id: string; classe_id: string; annee_scolaire_id: string }) {
    setEdition({ id: i.id, anneeId: i.annee_scolaire_id });
    setEleveId(i.eleve_id);
    setClasseId(i.classe_id);
  }

  const classesFormulaire = classesQuery.data?.filter((classe) =>
    classe.annee_scolaire_id === (edition?.anneeId ?? anneeQuery.data?.id),
  ) ?? [];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!classesFormulaire.some((classe) => classe.id === classeId)) return;
    if (editingId) {
      if (!classeId) return;
      updateMutation.mutate();
      return;
    }
    if (!eleveId || !classeId || !anneeQuery.data) return;
    createMutation.mutate();
  }

  const periodeBulletin = periodesQuery.data?.find((periode) => periode.id === periodeBulletinId);

  const decisionInscription = inscriptionsQuery.data?.find((inscription) => inscription.id === decisionInscriptionId);

  const remisesQuery = useQuery({
    queryKey: ["remises-bulletins", periodeBulletinId],
    queryFn: () => getRemisesBulletins(client, periodeBulletinId),
    enabled: Boolean(periodeBulletinId),
  });
  const remiseMutation = useMutation({
    mutationFn: ({ periode, inscription, destinataire }: {
      periode: string; inscription: string; destinataire: "eleve" | "tuteur" | null;
    }) => destinataire
      ? enregistrerRemiseBulletin(client, periode, inscription, destinataire)
      : annulerRemiseBulletin(client, periode, inscription),
    onSuccess: (_data, { periode }) => queryClient.invalidateQueries({ queryKey: ["remises-bulletins", periode] }),
  });
  const echeance = reglages.echeanceRemiseBulletins ? periodeBulletin?.echeance_bulletins : null;
  const remises = new Map(remisesQuery.data?.map((remise) => [remise.inscription_id, remise]));

  const classesPeriode = classesQuery.data?.filter((classe) => classe.annee_scolaire_id === periodeBulletin?.annee_scolaire_id) ?? [];

  async function chargerBulletin(
    inscription: Awaited<ReturnType<typeof getInscriptions>>[number],
    periode: NonNullable<typeof periodeBulletin>,
    etablissementNom: string,
    filtreClasse?: string,
    inclureDecision = true,
  ): Promise<BulletinHtmlInput> {
    const [lignes, details, decisionConseil] = await Promise.all([
      getBulletin(client, inscription.eleve_id, periode.id),
      getDetailsBulletin(client, inscription.eleve_id, periode.id),
      inclureDecision ? getDecisionConseilPubliee(client, inscription.eleve_id, periode.id) : null,
    ]);
    const detailsClasse = filtreClasse
      ? details.filter((note) => note.releves_notes?.matiere_classe?.classes?.id === filtreClasse)
      : details;
    const matieres = new Set(detailsClasse.map((note) => note.releves_notes?.matiere_classe_id));
    return {
      etablissementNom,
      eleveNom: inscription.profiles?.nom ?? "",
      elevePrenom: inscription.profiles?.prenom ?? "",
      periodeNom: periode.nom,
      lignes: filtreClasse ? lignes.filter((ligne) => ligne.matiere_classe_id != null && matieres.has(ligne.matiere_classe_id)) : lignes,
      details: detailsClasse,
      decisionConseil,
    };
  }

  async function preparerDocument(action: () => Promise<void>) {
    setErreurBulletin("");
    setBilanImpression("");
    setImpressionEnCours(true);
    try {
      await action();
    } catch (error) {
      setErreurBulletin(error instanceof Error ? error.message : "Impossible de générer les bulletins. Réessayez.");
    } finally {
      setImpressionEnCours(false);
    }
  }

  async function handleBulletin(inscription: Awaited<ReturnType<typeof getInscriptions>>[number]) {
    if (!profile || !periodeBulletin || impressionEnCours || periodeBulletin.annee_scolaire_id !== inscription.annee_scolaire_id) return;
    await preparerDocument(() => imprimerBulletin(async () => {
      const etablissement = await getEtablissement(client, profile.etablissement_id);
      const bulletin = await chargerBulletin(inscription, periodeBulletin, etablissement.nom);
      if (!bulletin.lignes.length) throw new Error("Aucune note publiée pour cet élève sur cette période.");
      return buildBulletinHtml(bulletin);
    }));
  }

  async function handleBulletinsClasse(format: "impression" | "csv") {
    const classe = classesPeriode.find(({ id }) => id === classeBulletinId);
    if (!profile || !periodeBulletin || !classe || impressionEnCours) return;

    const chargerClasse = async () => {
      const [etablissement, inscriptions] = await Promise.all([
        format === "impression" ? getEtablissement(client, profile.etablissement_id) : null,
        getInscriptionsClasseAnnee(client, classe.id, periodeBulletin.annee_scolaire_id),
      ]);
      const comparer = new Intl.Collator("fr");
      inscriptions.sort((a, b) =>
        comparer.compare(a.profiles?.nom ?? "", b.profiles?.nom ?? "")
        || comparer.compare(a.profiles?.prenom ?? "", b.profiles?.prenom ?? ""));

      const bulletins: BulletinHtmlInput[] = [];
      for (let debut = 0; debut < inscriptions.length; debut += 5) {
        const lot = await Promise.all(inscriptions.slice(debut, debut + 5).map((inscription) =>
          chargerBulletin(inscription, periodeBulletin, etablissement?.nom ?? "", classe.id, format === "impression")));
        bulletins.push(...lot.filter((bulletin) => bulletin.lignes.some((ligne) => ligne.moyenne != null)));
      }
      if (!bulletins.length) throw new Error("Aucune note publiée pour cette classe sur cette période.");
      const sansNotes = inscriptions.length - bulletins.length;
      const resultat = format === "impression" ? `${bulletins.length} bulletin(s) préparé(s).` : `Résultats exportés pour ${bulletins.length} élève(s).`;
      setBilanImpression(`${resultat}${sansNotes ? ` ${sansNotes} élève(s) sans note publiée.` : ""}`);
      return bulletins;
    };

    await preparerDocument(async () => {
      if (format === "impression") {
        await imprimerBulletin(async () => buildBulletinsHtml(await chargerClasse()));
      } else {
        const bulletins = await chargerClasse();
        const nom = `resultats-${libelleClasse(classe)}-${periodeBulletin.nom}`.replace(/[^\p{L}\p{N}.-]+/gu, "-");
        telechargerFichierTexte(construireResultatsCsv(bulletins, libelleClasse(classe), periodeBulletin.nom), `${nom}.csv`, "text/csv;charset=utf-8");
      }
    });
  }

  const anneeActive = anneeQuery.data;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Inscriptions des élèves" description="Inscrire les élèves dans leurs classes." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Élève">
              <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required disabled={Boolean(editingId)}>
                <option value="">—</option>
                {elevesQuery.data?.map((el) => (
                  <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Classe">
              <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} required>
                <option value="">—</option>
                {classesFormulaire.map((c) => (
                  <option key={c.id} value={c.id}>{libelleClasse(c)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={isPending || (!editingId && !anneeQuery.data)}>
            {editingId ? "Enregistrer" : "Inscrire"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
          )}
        </form>
      </Card>

      {anneeActive && (
        <ImportInscriptions
          key={anneeActive.id}
          anneeId={anneeActive.id}
          classes={classesQuery.data?.filter((classe) => classe.annee_scolaire_id === anneeActive.id) ?? []}
        />
      )}

      <div className="mb-3 max-w-xs">
        <Field label="Période des bulletins">
          <Select value={periodeBulletinId} onChange={(event) => { setPeriodeBulletinId(event.target.value); setClasseBulletinId(""); setBilanImpression(""); setErreurBulletin(""); setDecisionInscriptionId(null); remiseMutation.reset(); }} disabled={impressionEnCours}>
            <option value="">Choisir une période</option>
            {periodesQuery.data?.map((periode) => (
              <option key={periode.id} value={periode.id}>{periode.nom}</option>
            ))}
          </Select>
        </Field>
      </div>
      {periodeBulletin && (
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <Field label="Classe des bulletins et résultats">
            <Select value={classeBulletinId} onChange={(event) => { setClasseBulletinId(event.target.value); setBilanImpression(""); setErreurBulletin(""); }} disabled={impressionEnCours}>
              <option value="">Choisir une classe</option>
              {classesPeriode.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {libelleClasse(classe)}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => handleBulletinsClasse("impression")} disabled={!classeBulletinId || impressionEnCours}>
            Imprimer les bulletins de la classe
          </Button>
          <Button variant="secondary" onClick={() => handleBulletinsClasse("csv")} disabled={!classeBulletinId || impressionEnCours}>
            Exporter les résultats (CSV)
          </Button>
          {impressionEnCours && <p role="status" className="text-sm text-slate-600">Préparation…</p>}
        </div>
      )}
      {bilanImpression && <p role="status" className="mb-3 text-sm text-slate-700">{bilanImpression}</p>}
      {periodeBulletin && decisionInscription && (
        <DecisionConseilClasse
          key={`${periodeBulletin.id}:${decisionInscription.id}`}
          inscriptionId={decisionInscription.id}
          periodeId={periodeBulletin.id}
          eleve={`${decisionInscription.profiles?.prenom ?? ""} ${decisionInscription.profiles?.nom ?? ""}`.trim()}
          onFermer={() => setDecisionInscriptionId(null)}
        />
      )}
      {echeance && <p className="mb-2 text-sm text-slate-700">Échéance de remise au collège et au lycée {dateFr.format(new Date(echeance))}.</p>}
      {remisesQuery.isError && <p role="alert" className="mb-3 text-sm text-red-700">Impossible de charger les remises.</p>}
      {remiseMutation.error && <p role="alert" className="mb-3 text-sm text-red-700">{remiseMutation.error.message}</p>}
      {erreurBulletin && <p role="alert" className="mb-3 text-sm text-red-700">{erreurBulletin}</p>}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="Filtrer les inscriptions par classe">
          <Select aria-label="Filtrer les inscriptions par classe" value={classeFiltre?.id ?? ""}
            disabled={classesQuery.isPending || classesQuery.isError}
            onChange={(event) => {
              setFiltreClasseId(event.target.value);
              setDecisionInscriptionId(null);
            }}>
            <option value="">Toutes les classes</option>
            {classesQuery.data?.map((classe) => (
              <option key={classe.id} value={classe.id}>
                {libelleClasse(classe)}{annees.get(classe.annee_scolaire_id) ? ` — ${annees.get(classe.annee_scolaire_id)}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        {classeFiltre && inscriptionsQuery.isSuccess && (
          <p role="status" className="pb-2 text-sm text-slate-600">
            {inscriptionsAffichees.length} {inscriptionsAffichees.length === 1 ? "élève inscrit" : "élèves inscrits"}
          </p>
        )}
      </div>
      <Card className="overflow-x-auto">
        {inscriptionsQuery.isPending ? (
          <EmptyState message="Chargement des inscriptions…" />
        ) : inscriptionsQuery.isError ? (
          <div className="flex flex-wrap items-center gap-3 p-4">
            <p role="alert" className="text-sm text-red-700">Impossible de charger les inscriptions.</p>
            <Button variant="secondary" onClick={() => inscriptionsQuery.refetch()}>Réessayer</Button>
          </div>
        ) : inscriptionsAffichees.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Élève</th>
                <th className="px-4 py-2">Classe</th>
                {periodeBulletin && <th className="px-4 py-2">Remise du bulletin</th>}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inscriptionsAffichees.map((i) => {
                const classe = classesQuery.data?.find((c) => c.id === i.classe_id);
                const remise = remises.get(i.id);
                const periodeCorrespond = periodeBulletin?.annee_scolaire_id === i.annee_scolaire_id;
                const echeanceClasse = classe?.cycle === "college" || classe?.cycle === "lycee" ? echeance : null;
                const enRetard = echeanceClasse && dateBrazzaville.format(remise ? new Date(remise.remis_le) : new Date()) > echeanceClasse;
                const modifierRemise = (destinataire: "eleve" | "tuteur" | null) =>
                  remiseMutation.mutate({ periode: periodeBulletinId, inscription: i.id, destinataire });
                return (
                <tr key={i.id}>
                  <td className="px-4 py-2 text-slate-900">{i.profiles?.prenom} {i.profiles?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{libelleClasse(classe)}</td>
                  {periodeBulletin && (
                    <td className="px-4 py-2">
                      {periodeCorrespond && remisesQuery.isSuccess ? (
                        <>
                          <p className={enRetard ? "text-amber-800" : "text-slate-700"}>
                            {remise
                              ? `Remis ${remise.destinataire === "eleve" ? "à l’élève" : "au tuteur"} le ${dateFr.format(new Date(remise.remis_le))}`
                              : "À remettre"}
                            {enRetard && " · En retard"}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {remise ? (
                              <Button variant="ghost" disabled={remiseMutation.isPending} onClick={() => modifierRemise(null)}>Annuler la remise</Button>
                            ) : (
                              <>
                                <Button variant="ghost" disabled={remiseMutation.isPending} onClick={() => modifierRemise("eleve")}>Remis à l’élève</Button>
                                <Button variant="ghost" disabled={remiseMutation.isPending} onClick={() => modifierRemise("tuteur")}>Remis au tuteur</Button>
                              </>
                            )}
                          </div>
                        </>
                      ) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right">
                    {reglages.decisionConseilLycee && periodeCorrespond && classe?.cycle === "lycee" && (
                      <Button variant="ghost" className="mr-3" onClick={() => setDecisionInscriptionId(i.id)}>
                        Décision du conseil
                      </Button>
                    )}
                    <Button variant="ghost" className="mr-3" onClick={() => handleBulletin(i)}
                      disabled={impressionEnCours || periodeBulletin?.annee_scolaire_id !== i.annee_scolaire_id}>
                      Imprimer le bulletin
                    </Button>
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(i)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(i.id)}>Supprimer</Button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState message={classeFiltre ? "Aucun élève inscrit dans cette classe." : "Aucune inscription pour le moment."} />
        )}
      </Card>
    </div>
  );
}

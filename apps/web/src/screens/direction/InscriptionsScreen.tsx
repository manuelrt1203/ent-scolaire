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
  getBulletin,
  getDetailsBulletin,
  getDecisionConseilPubliee,
  getEtablissement,
  buildBulletinHtml,
  usePeriodes,
  useEtablissementCalendrier,
  getRemisesBulletins,
  enregistrerRemiseBulletin,
  annulerRemiseBulletin,
} from "@ent/shared";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eleveId, setEleveId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [decisionInscriptionId, setDecisionInscriptionId] = useState<string | null>(null);
  const [periodeBulletinId, setPeriodeBulletinId] = useState("");
  const [impressionEnCours, setImpressionEnCours] = useState(false);
  const [erreurBulletin, setErreurBulletin] = useState("");
  const periodesQuery = usePeriodes(client);

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

  async function handleBulletin(inscription: NonNullable<typeof inscriptionsQuery.data>[number]) {
    if (!profile || !periodeBulletin || impressionEnCours || periodeBulletin.annee_scolaire_id !== inscription.annee_scolaire_id) return;
    setErreurBulletin("");
    setImpressionEnCours(true);
    try {
      await imprimerBulletin(async () => {
        const [lignes, details, etablissement, decisionConseil] = await Promise.all([
          getBulletin(client, inscription.eleve_id, periodeBulletin.id),
          getDetailsBulletin(client, inscription.eleve_id, periodeBulletin.id),
          getEtablissement(client, profile.etablissement_id),
          getDecisionConseilPubliee(client, inscription.eleve_id, periodeBulletin.id),
        ]);
        if (!lignes.length) throw new Error("Aucune note publiée pour cet élève sur cette période.");
        return buildBulletinHtml({
          etablissementNom: etablissement?.nom ?? "",
          eleveNom: inscription.profiles?.nom ?? "",
          elevePrenom: inscription.profiles?.prenom ?? "",
          periodeNom: periodeBulletin.nom,
          lignes,
          details,
          decisionConseil,
        });
      });
    } catch (error) {
      setErreurBulletin(error instanceof Error ? error.message : "Impossible de générer le bulletin. Réessayez.");
    } finally {
      setImpressionEnCours(false);
    }
  }

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
                {classesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
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

      <div className="mb-3 max-w-xs">
        <Field label="Période des bulletins">
          <Select value={periodeBulletinId} onChange={(event) => { setPeriodeBulletinId(event.target.value); setDecisionInscriptionId(null); remiseMutation.reset(); }} disabled={impressionEnCours}>
            <option value="">Choisir une période</option>
            {periodesQuery.data?.map((periode) => (
              <option key={periode.id} value={periode.id}>{periode.nom}</option>
            ))}
          </Select>
        </Field>
      </div>
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
      <Card className="overflow-x-auto">
        {inscriptionsQuery.data?.length ? (
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
              {inscriptionsQuery.data.map((i) => {
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
                  <td className="px-4 py-2 text-slate-500">{classe?.nom}</td>
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
          <EmptyState message="Aucune inscription pour le moment." />
        )}
      </Card>
    </div>
  );
}

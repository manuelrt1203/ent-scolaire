import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  getAnneesScolaires, getClasses, getSuiviRelevesClasse, libelleClasse, useAuth, usePeriodes,
  type StatutNote,
} from "@ent/shared";
import { Card, EmptyState } from "./ui/Card";
import { Field, Select } from "./ui/Field";

type StatutSuivi = StatutNote | "non_cree";

const libelles: Record<StatutSuivi, string> = {
  non_cree: "Saisie à démarrer",
  brouillon: "Brouillon",
  soumise: "À valider",
  validee: "À publier",
  publiee: "Publié",
};

export function SuiviRelevesClasse() {
  const { client, profile } = useAuth();
  const [filtres, setFiltres] = useSearchParams();
  const periodeId = filtres.get("periode") ?? "";
  const classeId = filtres.get("classe") ?? "";
  const periodes = usePeriodes(client);
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const etablissementId = profile?.etablissement_id;
  const annees = useQuery({
    queryKey: ["annees-scolaires", etablissementId],
    queryFn: () => getAnneesScolaires(client, etablissementId!),
    enabled: Boolean(etablissementId),
  });
  const nomsAnnees = new Map(annees.data?.map(({ id, libelle }) => [id, libelle]));
  const periode = periodes.data?.find(({ id }) => id === periodeId);
  const classesPeriode = classes.data?.filter((classe) => classe.annee_scolaire_id === periode?.annee_scolaire_id) ?? [];
  const classe = classesPeriode.find(({ id }) => id === classeId);
  const suivi = useQuery({
    queryKey: ["releves-direction", "suivi-classe", classe?.id, periode?.id],
    queryFn: () => getSuiviRelevesClasse(client, classe!.id, periode!.annee_scolaire_id, periode!.id),
    enabled: Boolean(classe && periode),
  });
  const matieres = [...(suivi.data ?? [])].sort((a, b) => (a.matieres?.nom ?? "").localeCompare(b.matieres?.nom ?? "", "fr"));
  const totaux: Record<StatutSuivi, number> = { non_cree: 0, brouillon: 0, soumise: 0, validee: 0, publiee: 0 };
  for (const matiere of matieres) {
    totaux[matiere.releves_notes[0]?.statut ?? "non_cree"] += 1;
  }
  function choisirFiltre(nom: "periode" | "classe", valeur: string) {
    setFiltres((actuels) => {
      const suivants = new URLSearchParams(actuels);
      if (valeur) suivants.set(nom, valeur);
      else suivants.delete(nom);
      if (nom === "periode") suivants.delete("classe");
      return suivants;
    }, { replace: true });
  }

  const erreur = periodes.isError || classes.isError || suivi.isError;

  return (
    <Card className="mb-6 p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-midnight-ink">Avancement par classe</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Période du suivi">
          <Select aria-label="Période du suivi" value={periode?.id ?? ""}
            onChange={(event) => choisirFiltre("periode", event.target.value)}>
            <option value="">Choisir une période</option>
            {periodes.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.nom, nomsAnnees.get(p.annee_scolaire_id)].filter(Boolean).join(" · ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Classe du suivi">
          <Select aria-label="Classe du suivi" value={classe?.id ?? ""} disabled={!periode || classes.isPending}
            onChange={(event) => choisirFiltre("classe", event.target.value)}>
            <option value="">Choisir une classe</option>
            {classesPeriode.map((c) => <option key={c.id} value={c.id}>{libelleClasse(c)}</option>)}
          </Select>
        </Field>
      </div>
      {erreur && <p role="alert" className="mt-3 text-sm text-red-700">Impossible de charger le suivi des relevés.</p>}
      {periode && classes.isSuccess && !classesPeriode.length &&
        <p className="mt-3 text-sm text-slate-600">Aucune classe pour cette année scolaire.</p>}
      {classe && suivi.isPending && <p role="status" className="mt-3 text-sm text-slate-600">Chargement des matières…</p>}
      {classe && suivi.isSuccess && (matieres.length ? (
        <>
          <p role="status" className="mt-4 text-sm text-slate-700">
            {totaux.publiee} / {matieres.length} relevés publiés
          </p>
          <dl className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(totaux) as StatutSuivi[]).map((statut) => (
              <div key={statut} className={`rounded-lg px-3 py-2 ${statut === "publiee" ? "bg-ent-tint text-ent-accent" : "bg-slate-50 text-slate-700"}`}>
                <dt className="text-xs">{libelles[statut]}</dt>
                <dd className="text-lg font-semibold tabular-nums">{totaux[statut]}</dd>
              </div>
            ))}
          </dl>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr><th className="px-3 py-2">Matière</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Relevé</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matieres.map((matiere) => {
                  const releve = matiere.releves_notes[0];
                  return (
                    <tr key={matiere.id}>
                      <td className="px-3 py-2">{matiere.matieres?.nom ?? "Matière"}</td>
                      <td className="px-3 py-2 text-slate-600">{libelles[releve?.statut ?? "non_cree"]}</td>
                      <td className="px-3 py-2">{releve && (
                        <Link to={{ pathname: `/direction/releves/${releve.id}`, search: filtres.toString() }} className="font-medium text-ent-accent underline">Ouvrir</Link>
                      )}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : <EmptyState message="Aucune matière n’est configurée pour cette classe." />)}
    </Card>
  );
}

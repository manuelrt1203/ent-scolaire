import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getElevesPourImport, importerInscriptions, useAuth, type Classe } from "@ent/shared";
import { lireListeInscriptions, MAX_LIGNES_IMPORT, preparerListeInscriptions } from "../lib/importInscriptionsCsv";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, Input, Select } from "./ui/Field";

export function ImportInscriptions({ classes, anneeId }: { classes: Classe[]; anneeId: string }) {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [classeId, setClasseId] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  const analyse = useMutation({
    mutationFn: async ({ fichier, etablissementId }: { fichier: File; etablissementId: string }) => {
      if (fichier.size > 512 * 1024) throw new Error("Le fichier dépasse 512 Ko.");
      const emails = lireListeInscriptions(await fichier.text());
      const { eleves, inscrits } = await getElevesPourImport(client, etablissementId, anneeId);
      return preparerListeInscriptions(emails, eleves, inscrits);
    },
  });
  const inscription = useMutation({
    mutationFn: ({ cible, ids }: { cible: string; ids: string[] }) => importerInscriptions(client, cible, anneeId, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inscriptions"] }),
  });

  const aInscrire = analyse.data?.flatMap((ligne) => ligne.statut === "Prêt" ? [ligne.eleveId] : []) ?? [];
  const occupe = analyse.isPending || inscription.isPending;
  const erreur = analyse.error ?? inscription.error;
  const classe = classes.find(({ id }) => id === classeId);

  return (
    <Card className="mb-6 space-y-3 p-4">
      <h2 className="text-sm font-semibold">Importer une liste d’élèves</h2>
      <p className="text-xs text-slate-600">
        CSV avec une colonne <code>email</code> et une ligne par élève. Les comptes doivent déjà exister. Maximum {MAX_LIGNES_IMPORT} élèves.
      </p>
      <a className="inline-block text-xs text-indigo-ink underline" download="modele-inscriptions.csv"
        href="data:text/csv;charset=utf-8,email%0Aeleve%40exemple.fr%0A">Télécharger le modèle CSV</a>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Classe de destination">
          <Select aria-label="Classe de destination" value={classeId} disabled={occupe} onChange={(event) => {
            setClasseId(event.target.value);
            inscription.reset();
          }}>
            <option value="">Choisir une classe</option>
            {classes.map((option) => (
              <option key={option.id} value={option.id}>
                {[option.nom, option.niveau !== option.nom ? option.niveau : null, option.serie].filter(Boolean).join(" · ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fichier CSV">
          <Input aria-label="Fichier CSV" type="file" accept=".csv,text/csv" disabled={occupe} onChange={(event) => {
            setFichier(event.target.files?.[0] ?? null);
            analyse.reset();
            inscription.reset();
          }} />
        </Field>
        <Button variant="secondary" disabled={!fichier || !profile || occupe}
          onClick={() => {
            if (!fichier || !profile) return;
            inscription.reset();
            analyse.mutate({ fichier, etablissementId: profile.etablissement_id });
          }}>
          {analyse.isPending ? "Analyse…" : "Vérifier le fichier"}
        </Button>
      </div>
      {erreur && <p role="alert" className="text-sm text-red-700">{erreur.message}</p>}
      {analyse.data && (
        <>
          <p role="status" className="text-sm text-slate-700">
            {aInscrire.length} sur {analyse.data.length} ligne(s) prête(s) à être inscrite(s).
          </p>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead><tr><th className="p-2">E-mail</th><th className="p-2">Résultat</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {analyse.data.map(({ email, statut }, index) => (
                  <tr key={index}><td className="p-2">{email || "—"}</td><td className="p-2">{statut}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button disabled={!classe || !aInscrire.length || occupe || inscription.isSuccess}
            onClick={() => classe && inscription.mutate({ cible: classe.id, ids: aInscrire })}>
            {inscription.isPending ? "Inscription…" : `Inscrire ${aInscrire.length} élève(s)${classe ? ` dans ${classe.nom}` : ""}`}
          </Button>
        </>
      )}
      {inscription.isSuccess && (
        <p role="status" className="text-sm text-emerald-800">
          {inscription.data} élève(s) inscrit(s).
          {inscription.data < aInscrire.length && ` ${aInscrire.length - inscription.data} inscription(s) déjà enregistrée(s) entre-temps.`}
        </p>
      )}
    </Card>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ajouterMatieresClasse, getMatiereClasses, libelleClasse, useAuth, type Classe } from "@ent/shared";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, Select } from "./ui/Field";

export function CopierGrilleClasse({ classes, anneeId }: { classes: Classe[]; anneeId: string }) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");

  const source = classes.find(({ id }) => id === sourceId);
  const destinations = source ? classes.filter((classe) =>
    classe.id !== source.id
    && classe.etablissement_id === source.etablissement_id
    && classe.cycle === source.cycle && classe.niveau === source.niveau
    && (classe.serie ?? "").trim().toLowerCase() === (source.serie ?? "").trim().toLowerCase()) : [];
  const destination = destinations.find(({ id }) => id === destinationId);
  const grilleSource = useQuery({
    queryKey: ["matiere-classes", source?.id],
    queryFn: () => getMatiereClasses(client, sourceId),
    enabled: Boolean(source),
  });
  const grilleDestination = useQuery({
    queryKey: ["matiere-classes", destination?.id],
    queryFn: () => getMatiereClasses(client, destinationId),
    enabled: Boolean(destination),
  });
  const dejaAssociees = new Set(grilleDestination.data?.filter((ligne) => ligne.annee_scolaire_id === anneeId)
    .map((ligne) => ligne.matiere_id));
  const grille = grilleSource.data?.filter((ligne) => ligne.annee_scolaire_id === anneeId) ?? [];
  const aCopier = grille.filter((ligne) => !dejaAssociees.has(ligne.matiere_id));
  const copie = useMutation({
    mutationFn: ({ cible, lignes }: { cible: string; lignes: typeof aCopier }) => ajouterMatieresClasse(client,
      lignes.map(({ matiere_id, coefficient }) => ({ matiere_id, coefficient, classe_id: cible, annee_scolaire_id: anneeId }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matiere-classes"] }),
  });
  const erreur = grilleSource.error ?? grilleDestination.error ?? copie.error;

  return (
    <Card className="mb-6 space-y-3 p-4">
      <h2 className="text-sm font-semibold">Copier une grille de matières</h2>
      <p className="text-xs text-slate-600">Réutilisez les matières et coefficients d’une classe du même niveau et de la même série.</p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Classe source">
          <Select aria-label="Classe source" value={sourceId} disabled={copie.isPending} onChange={(event) => {
            setSourceId(event.target.value);
            setDestinationId("");
            copie.reset();
          }}>
            <option value="">Choisir la classe source</option>
            {classes.map((classe) => <option key={classe.id} value={classe.id}>{libelleClasse(classe)}</option>)}
          </Select>
        </Field>
        <Field label="Classe de destination">
          <Select aria-label="Classe de destination" value={destination?.id ?? ""} disabled={!destinations.length || copie.isPending} onChange={(event) => {
            setDestinationId(event.target.value);
            copie.reset();
          }}>
            <option value="">Choisir la classe de destination</option>
            {destinations.map((classe) => <option key={classe.id} value={classe.id}>{libelleClasse(classe)}</option>)}
          </Select>
        </Field>
      </div>
      {source && !destinations.length && <p className="text-sm text-slate-600">Aucune autre classe du même niveau et de la même série.</p>}
      {source && grilleSource.isSuccess && !grille.length && <p className="text-sm text-slate-600">La classe source n’a aucune matière configurée.</p>}
      {erreur && <p role="alert" className="text-sm text-red-700">{erreur.message}</p>}
      {destination && grilleSource.isSuccess && grilleDestination.isSuccess && grille.length > 0 && (
        <>
          <ul className="max-h-48 overflow-auto divide-y divide-slate-100 text-sm">
            {grille.map((ligne) => (
              <li key={ligne.id} className="flex justify-between gap-3 py-1.5">
                <span>{ligne.matieres?.nom ?? "Matière"}</span>
                <span className="text-slate-600">{dejaAssociees.has(ligne.matiere_id) ? "Déjà configurée" : `Coefficient ${ligne.coefficient}`}</span>
              </li>
            ))}
          </ul>
          <Button disabled={copie.isPending || !aCopier.length}
            onClick={() => copie.mutate({ cible: destination.id, lignes: aCopier })}>
            {copie.isPending ? "Copie…" : `Copier ${aCopier.length} matière(s)`}
          </Button>
        </>
      )}
      {copie.isSuccess && <p role="status" className="text-sm text-emerald-800">{copie.data} matière(s) ajoutée(s).</p>}
    </Card>
  );
}

import { useState, type FormEvent } from "react";
import { useAuth, useMesAffectations, useCahierTexteMatiereClasse, useCreateEntreeCahierTexte, useDeleteEntreeCahierTexte } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function CahierTexteScreen() {
  const { client } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [dateSeance, setDateSeance] = useState(() => new Date().toISOString().slice(0, 10));
  const [contenuSeance, setContenuSeance] = useState("");
  const [travailAFaire, setTravailAFaire] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");

  const cahierQuery = useCahierTexteMatiereClasse(client, matiereClasseId || null);
  const creerEntree = useCreateEntreeCahierTexte(client);
  const supprimerEntree = useDeleteEntreeCahierTexte(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matiereClasseId) return;
    creerEntree.mutate(
      {
        matiere_classe_id: matiereClasseId,
        date_seance: dateSeance,
        contenu_seance: contenuSeance || null,
        travail_a_faire: travailAFaire || null,
        date_echeance: dateEcheance || null,
      },
      {
        onSuccess: () => {
          setContenuSeance("");
          setTravailAFaire("");
          setDateEcheance("");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Cahier de textes" description="Renseigner le contenu de vos séances." />

      <Card className="mb-6 p-4">
        <Field label="Matière / Classe">
          <Select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)}>
            <option value="">—</option>
            {affectationsQuery.data?.map((a: any) => (
              <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
                {a.matiere_classe.matieres?.nom} — {a.matiere_classe.classes?.nom}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {matiereClasseId && (
        <>
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <Field label="Date de séance">
                  <Input type="date" value={dateSeance} onChange={(e) => setDateSeance(e.target.value)} required />
                </Field>
                <Field label="Devoirs à rendre pour le">
                  <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
                </Field>
              </div>
              <Field label="Contenu de la séance">
                <Textarea value={contenuSeance} onChange={(e) => setContenuSeance(e.target.value)} rows={2} />
              </Field>
              <Field label="Travail à faire">
                <Textarea value={travailAFaire} onChange={(e) => setTravailAFaire(e.target.value)} rows={2} />
              </Field>
              <Button type="submit" disabled={creerEntree.isPending}>Ajouter</Button>
            </form>
          </Card>

          <div className="space-y-3">
            {cahierQuery.data?.map((entree: any) => (
              <Card key={entree.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{formatDate(entree.date_seance)}</p>
                  <Button variant="danger" onClick={() => supprimerEntree.mutate(entree.id)}>Supprimer</Button>
                </div>
                {entree.contenu_seance && <p className="mb-1 text-sm text-slate-700">{entree.contenu_seance}</p>}
                {entree.travail_a_faire && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Travail à faire :</span> {entree.travail_a_faire}
                    {entree.date_echeance && ` (pour le ${formatDate(entree.date_echeance)})`}
                  </p>
                )}
              </Card>
            ))}
            {cahierQuery.data?.length === 0 && <EmptyState message="Aucune entrée pour cette matière/classe." />}
          </div>
        </>
      )}
    </div>
  );
}

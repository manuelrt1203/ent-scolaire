import { useState, type FormEvent } from "react";
import { useAuth, useEvenementsCalendrier, useCreateEvenementCalendrier, useDeleteEvenementCalendrier, useEtablissementCalendrier, formatDateHeureCalendrier, dateHeureSaisieCalendrier, lireDateHeureCalendrier, type Role } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { DatesOfficielles } from "../../components/calendrier/DatesOfficielles";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";

const CIBLES: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "eleve", label: "Élèves" },
  { value: "parent", label: "Parents" },
  { value: "professeur", label: "Professeurs" },
];

export function CalendrierScreen() {
  const { client, profile } = useAuth();
  const { pays, charge } = useEtablissementCalendrier(client, profile);
  const [maintenant] = useState(() => Date.now());
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [saisieDebut, setDateDebut] = useState<string | null>(null);
  const [saisieFin, setDateFin] = useState<string | null>(null);
  const [erreurDates, setErreurDates] = useState("");
  const dateDebut = saisieDebut ?? dateHeureSaisieCalendrier(new Date(maintenant), pays);
  const dateFin = saisieFin ?? dateHeureSaisieCalendrier(new Date(maintenant + 3600_000), pays);
  const [lieu, setLieu] = useState("");
  const [cible, setCible] = useState("");

  const evenementsQuery = useEvenementsCalendrier(client);
  const creerEvenement = useCreateEvenementCalendrier(client);
  const supprimerEvenement = useDeleteEvenementCalendrier(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !charge || !titre.trim()) return;
    const debut = lireDateHeureCalendrier(dateDebut, pays);
    const fin = lireDateHeureCalendrier(dateFin, pays);
    if (!Number.isFinite(debut.getTime()) || !Number.isFinite(fin.getTime()) || fin < debut) {
      setErreurDates("La fin doit être à la même heure ou après le début.");
      return;
    }
    setErreurDates("");
    creerEvenement.mutate(
      {
        etablissement_id: profile.etablissement_id,
        auteur_id: profile.id,
        titre,
        description: description || null,
        date_debut: debut.toISOString(),
        date_fin: fin.toISOString(),
        lieu: lieu || null,
        cible: (cible || null) as Role | null,
      },
      {
        onSuccess: () => {
          setTitre("");
          setDescription("");
          setLieu("");
          setCible("");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Calendrier" description="Événements et dates clés de l'année." />

      <DatesOfficielles />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Titre">
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} required />
          </Field>
          <div className="flex flex-wrap gap-3">
            <div>
              <Field label={pays === "CG" ? "Début (heure de Brazzaville)" : "Début"}>
                <Input type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
              </Field>
            </div>
            <div>
              <Field label={pays === "CG" ? "Fin (heure de Brazzaville)" : "Fin"}>
                <Input type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
              </Field>
            </div>
            <div>
              <Field label="Lieu">
                <Input value={lieu} onChange={(e) => setLieu(e.target.value)} />
              </Field>
            </div>
            <div>
              <Field label="Destinataires">
                <Select value={cible} onChange={(e) => setCible(e.target.value)}>
                  {CIBLES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <Button type="submit" disabled={!charge || creerEvenement.isPending}>Ajouter</Button>
          {(erreurDates || creerEvenement.error) && (
            <p role="alert" className="text-sm text-red-700">{erreurDates || creerEvenement.error?.message}</p>
          )}
        </form>
      </Card>

      <div className="space-y-3">
        {evenementsQuery.data?.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{e.titre}</p>
              <Button variant="danger" onClick={() => supprimerEvenement.mutate(e.id)}>Supprimer</Button>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {formatDateHeureCalendrier(e.date_debut, pays)} – {formatDateHeureCalendrier(e.date_fin, pays)}
              {e.lieu && ` · ${e.lieu}`} · {CIBLES.find((c) => c.value === (e.cible ?? ""))?.label ?? "Tous"}
            </p>
            {e.description && <p className="text-sm text-slate-700">{e.description}</p>}
          </Card>
        ))}
        {evenementsQuery.data?.length === 0 && <EmptyState message="Aucun événement au calendrier." />}
      </div>
    </div>
  );
}

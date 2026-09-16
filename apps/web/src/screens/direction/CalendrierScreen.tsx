import { useState, type FormEvent } from "react";
import { useAuth, useEvenementsCalendrier, useCreateEvenementCalendrier, useDeleteEvenementCalendrier } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";

const CIBLES: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "eleve", label: "Élèves" },
  { value: "parent", label: "Parents" },
  { value: "professeur", label: "Professeurs" },
];

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CalendrierScreen() {
  const { client, profile } = useAuth();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState(() => toDatetimeLocal(new Date()));
  const [dateFin, setDateFin] = useState(() => toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [lieu, setLieu] = useState("");
  const [cible, setCible] = useState("");

  const evenementsQuery = useEvenementsCalendrier(client);
  const creerEvenement = useCreateEvenementCalendrier(client);
  const supprimerEvenement = useDeleteEvenementCalendrier(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !titre.trim()) return;
    creerEvenement.mutate(
      {
        etablissement_id: profile.etablissement_id,
        auteur_id: profile.id,
        titre,
        description: description || null,
        date_debut: new Date(dateDebut).toISOString(),
        date_fin: new Date(dateFin).toISOString(),
        lieu: lieu || null,
        cible: (cible || null) as any,
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

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Titre">
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} required />
          </Field>
          <div className="flex flex-wrap gap-3">
            <div>
              <Field label="Début">
                <Input type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
              </Field>
            </div>
            <div>
              <Field label="Fin">
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
          <Button type="submit" disabled={creerEvenement.isPending}>Ajouter</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {evenementsQuery.data?.map((e: any) => (
          <Card key={e.id} className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{e.titre}</p>
              <Button variant="danger" onClick={() => supprimerEvenement.mutate(e.id)}>Supprimer</Button>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {formatDateHeure(e.date_debut)} – {formatDateHeure(e.date_fin)}
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

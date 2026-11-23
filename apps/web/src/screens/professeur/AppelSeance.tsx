import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enregistrerAppelSeance, getAppelSeance, getInscriptionsClasseAnnee,
  libelleClasse, useAuth, type getCreneaux, type PresenceSeance,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

type Creneau = Awaited<ReturnType<typeof getCreneaux>>[number];

export function AppelSeance({ creneau, jour, fermer }: { creneau: Creneau; jour: string; fermer: () => void }) {
  const { client } = useAuth();
  const [date, setDate] = useState("");
  const { classe_id: classeId, annee_scolaire_id: anneeId } = creneau.matiere_classe;
  const jourChoisi = date ? new Date(`${date}T00:00:00Z`).getUTCDay() : null;
  const dateValide = jourChoisi === creneau.jour_semaine;
  const inscriptions = useQuery({
    queryKey: ["inscriptions", classeId, anneeId],
    queryFn: () => getInscriptionsClasseAnnee(client, classeId, anneeId),
  });
  const appel = useQuery({
    queryKey: ["appel-seance", creneau.id, date],
    queryFn: () => getAppelSeance(client, creneau.id, date),
    enabled: dateValide,
  });

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Appel · {creneau.matiere_classe.matieres?.nom ?? "Cours"}</h2>
          <p className="text-sm text-slate-600">
            {libelleClasse(creneau.matiere_classe.classes)} · {jour} · {creneau.heure_debut.slice(0, 5)}–{creneau.heure_fin.slice(0, 5)}
          </p>
        </div>
        <Button variant="secondary" onClick={fermer}>Fermer l’appel</Button>
      </div>
      <div className="mb-4 max-w-xs">
        <Field label="Date de la séance">
          <Input type="date" aria-label="Date de la séance" autoFocus value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        {date && !dateValide && <p className="mt-2 text-sm text-amber-800">Ce cours a lieu le {jour.toLowerCase()}.</p>}
      </div>
      {(inscriptions.isError || appel.isError) && <p role="alert" className="text-sm text-red-700">Impossible de charger l’appel.</p>}
      {dateValide && (inscriptions.isPending || appel.isPending) && <p role="status" className="text-sm text-slate-600">Chargement de la liste…</p>}
      {dateValide && inscriptions.isSuccess && appel.isSuccess && (inscriptions.data.length > 0 ? (
        <FeuilleAppel
          key={date}
          creneauId={creneau.id}
          date={date}
          inscriptions={inscriptions.data}
          appel={appel.data}
        />
      ) : <EmptyState message="Aucun élève inscrit dans cette classe." />)}
    </Card>
  );
}

function FeuilleAppel({ creneauId, date, inscriptions, appel }: {
  creneauId: string;
  date: string;
  inscriptions: Awaited<ReturnType<typeof getInscriptionsClasseAnnee>>;
  appel: Awaited<ReturnType<typeof getAppelSeance>>;
}) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [modifications, setModifications] = useState<Record<string, PresenceSeance>>({});
  const [versionEdition, setVersionEdition] = useState<number | null>(null);
  const aChange = versionEdition !== null && versionEdition !== appel.version;
  const evenements = new Map(appel.evenements.map((evenement) => [evenement.eleve_id, evenement]));
  const lignes = [...inscriptions].sort((a, b) =>
    `${a.profiles?.nom ?? ""} ${a.profiles?.prenom ?? ""}`.localeCompare(`${b.profiles?.nom ?? ""} ${b.profiles?.prenom ?? ""}`, "fr")
  ).map(({ eleve_id, profiles }) => {
    const evenement = evenements.get(eleve_id);
    const presence: PresenceSeance = modifications[eleve_id] ?? {
      eleve_id,
      statut: evenement?.type === "absence" || evenement?.type === "retard" ? evenement.type : "present",
      minutes: evenement?.type === "retard" ? evenement.duree_minutes : null,
    };
    return {
      presence,
      nom: [profiles?.prenom, profiles?.nom].filter(Boolean).join(" ") || "Élève",
      protegee: Boolean(evenement?.justifie || evenement?.justificatif_chemin),
    };
  });

  const enregistrer = useMutation({
    mutationFn: () => enregistrerAppelSeance(client, creneauId, date, versionEdition ?? appel.version, lignes.map(({ presence }) => presence)),
    onError: () => queryClient.invalidateQueries({ queryKey: ["appel-seance", creneauId, date] }),
    onSuccess: async () => {
      setVersionEdition(null);
      setModifications({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appel-seance", creneauId, date] }),
        queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] }),
        queryClient.invalidateQueries({ queryKey: ["suivi-appels-classe"] }),
        queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] }),
      ]);
    },
  });

  function modifier(presence: PresenceSeance) {
    setVersionEdition((version) => version ?? appel.version);
    setModifications((actuelles) => ({ ...actuelles, [presence.eleve_id]: presence }));
  }

  function soumettre(event: FormEvent) {
    event.preventDefault();
    if (!aChange && !enregistrer.isPending) enregistrer.mutate();
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <p role="status" className="text-sm text-slate-600">
        {appel.version > 0 ? "Appel enregistré. Vous pouvez corriger un signalement." : "Tous les élèves sont présélectionnés présents."}
      </p>
      <fieldset disabled={enregistrer.isPending || aChange} className="divide-y divide-slate-200">
        <legend className="sr-only">Présences des élèves</legend>
        {lignes.map(({ presence, nom, protegee }) => (
          <div key={presence.eleve_id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="min-w-32 flex-1 text-sm font-medium">{nom}</span>
            <div className="w-32">
              <Select aria-label={`Présence de ${nom}`} disabled={protegee} value={presence.statut} onChange={(event) => {
                const statut = event.target.value as PresenceSeance["statut"];
                modifier({ ...presence, statut, minutes: statut === "retard" ? presence.minutes : null });
              }}>
                <option value="present">Présent</option>
                <option value="absence">Absent</option>
                <option value="retard">En retard</option>
              </Select>
            </div>
            {presence.statut === "retard" && (
              <div className="w-24">
                <Input aria-label={`Minutes de retard de ${nom}`} placeholder="Minutes" type="number" min={1} step={1} required disabled={protegee}
                  value={presence.minutes ?? ""} onChange={(event) => modifier({ ...presence, minutes: event.target.valueAsNumber || null })} />
              </div>
            )}
            {protegee && <span className="basis-full text-xs text-slate-600">Suivi par la Direction</span>}
          </div>
        ))}
      </fieldset>
      {enregistrer.isError && <p role="alert" className="text-sm text-red-700">{enregistrer.error.message}</p>}
      {aChange ? (
        <Button type="button" variant="secondary" onClick={() => { setVersionEdition(null); setModifications({}); }}>
          Reprendre depuis la dernière version
        </Button>
      ) : (
        <Button type="submit" disabled={enregistrer.isPending}>Enregistrer l’appel</Button>
      )}
    </form>
  );
}

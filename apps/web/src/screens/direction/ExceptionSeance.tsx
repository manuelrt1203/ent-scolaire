import { useState, type FormEvent } from "react";
import { useAuth, useExceptionsCreneaux, usePlanifierExceptionCreneau, type getCreneaux, type getExceptionsCreneaux } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";

type Creneau = Awaited<ReturnType<typeof getCreneaux>>[number];

export function ExceptionSeance({ creneau, fermer }: { creneau: Creneau; fermer: () => void }) {
  const { client } = useAuth();
  const [date, setDate] = useState("");
  const dateValide = Boolean(date && new Date(`${date}T00:00:00Z`).getUTCDay() === creneau.jour_semaine);
  const exceptions = useExceptionsCreneaux(client, [creneau.id], dateValide ? date : "");
  return (
    <Card className="mb-6 p-4">
      <div className="mb-4 flex flex-wrap justify-between gap-2">
        <h2 className="text-lg font-semibold">Modifier une séance · {creneau.matiere_classe.matieres?.nom ?? "Cours"}</h2>
        <Button variant="secondary" onClick={fermer}>Fermer</Button>
      </div>
      <div className="mb-4 max-w-xs">
        <Field label="Date de la séance">
          <Input autoFocus aria-label="Date de la séance" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        {date && !dateValide && <p className="mt-2 text-sm text-amber-800">Choisissez une date correspondant au jour habituel de ce cours.</p>}
      </div>
      {dateValide && exceptions.isPending && <p role="status" className="text-sm text-slate-600">Chargement de la séance…</p>}
      {exceptions.isError && <p role="alert" className="text-sm text-red-700">Impossible de charger la séance.</p>}
      {dateValide && exceptions.isSuccess && (
        <FormulaireException key={date} creneau={creneau} date={date} exception={exceptions.data[0]} />
      )}
    </Card>
  );
}

function FormulaireException({ creneau, date, exception }: {
  creneau: Creneau;
  date: string;
  exception: Awaited<ReturnType<typeof getExceptionsCreneaux>>[number] | undefined;
}) {
  const { client } = useAuth();
  const mutation = usePlanifierExceptionCreneau(client);
  const [debut, setDebut] = useState((exception?.heure_debut ?? creneau.heure_debut).slice(0, 5));
  const [fin, setFin] = useState((exception?.heure_fin ?? creneau.heure_fin).slice(0, 5));
  const [salle, setSalle] = useState((exception && !exception.annule ? exception.salle : creneau.salle) ?? "");
  const horairesValides = Boolean(debut && fin && debut < fin);

  function enregistrer(event: FormEvent) {
    event.preventDefault();
    if (horairesValides && !mutation.isPending) mutation.mutate({ creneauId: creneau.id, date, action: "modifier", debut, fin, salle });
  }

  return (
    <form onSubmit={enregistrer} className="space-y-3">
      {exception && <p className="text-sm font-medium text-slate-700">{exception.annule ? "Séance annulée" : "Séance modifiée"}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Nouveau début">
          <Input aria-label="Nouveau début" type="time" value={debut} onChange={(event) => setDebut(event.target.value)} required />
        </Field>
        <Field label="Nouvelle fin">
          <Input aria-label="Nouvelle fin" type="time" value={fin} onChange={(event) => setFin(event.target.value)} required />
        </Field>
        <Field label="Salle de la séance">
          <Input aria-label="Salle de la séance" value={salle} onChange={(event) => setSalle(event.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!horairesValides || mutation.isPending}>Enregistrer pour cette date</Button>
        {!exception?.annule && (
          <Button type="button" variant="danger-outline" disabled={mutation.isPending} onClick={() => {
            if (window.confirm("Annuler cette séance et avertir les personnes concernées ?")) {
              mutation.mutate({ creneauId: creneau.id, date, action: "annuler" });
            }
          }}>Annuler la séance</Button>
        )}
        {exception && (
          <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => {
            mutation.mutate({ creneauId: creneau.id, date, action: "retablir" }, { onSuccess: () => {
              setDebut(creneau.heure_debut.slice(0, 5));
              setFin(creneau.heure_fin.slice(0, 5));
              setSalle(creneau.salle ?? "");
            } });
          }}>Rétablir le cours habituel</Button>
        )}
      </div>
      {mutation.isError && <p role="alert" className="text-sm text-red-700">{mutation.error.message}</p>}
      {mutation.isSuccess && <p role="status" className="text-sm text-teal-800">Planning de cette date mis à jour.</p>}
    </form>
  );
}

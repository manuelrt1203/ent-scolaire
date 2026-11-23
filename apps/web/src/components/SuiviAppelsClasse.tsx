import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSuiviAppelsClasse, useAuth, useEtablissementCalendrier } from "@ent/shared";
import { Button } from "./ui/Button";
import { Card, EmptyState } from "./ui/Card";
import { Field, Input } from "./ui/Field";

export function SuiviAppelsClasse({ classeId, anneeId }: { classeId: string; anneeId: string }) {
  const { client, profile } = useAuth();
  const { fuseau } = useEtablissementCalendrier(client, profile);
  const [parametres, setParametres] = useSearchParams();
  const dateChoisie = parametres.get("date-appel");
  const date = dateChoisie ?? new Intl.DateTimeFormat("sv-SE", { timeZone: fuseau?.identifiant }).format(new Date());
  const suivi = useQuery({
    queryKey: ["suivi-appels-classe", classeId, anneeId, date],
    queryFn: () => getSuiviAppelsClasse(client, classeId, anneeId, date),
    enabled: Boolean(date),
  });
  const creneaux = suivi.data ?? [];
  const enregistres = creneaux.filter(({ enregistre }) => enregistre).length;

  function choisirSeance(nouvelleDate: string, creneauId?: string) {
    const suivants = new URLSearchParams(parametres);
    suivants.set("date-appel", nouvelleDate);
    if (creneauId) suivants.set("creneau", creneauId);
    else suivants.delete("creneau");
    setParametres(suivants, { replace: !creneauId });
  }

  return (
    <Card className="mb-6 p-4">
      <h2 className="mb-3 text-lg font-semibold text-midnight-ink">Suivi des appels</h2>
      <div className="mb-3 max-w-xs">
        <Field label="Date des appels">
          <Input type="date" aria-label="Date des appels" value={date} onChange={(event) => choisirSeance(event.target.value)} />
        </Field>
      </div>
      {!date && <p className="text-sm text-slate-600">Choisissez une date.</p>}
      {date && suivi.isPending && <p role="status" className="text-sm text-slate-600">Chargement des appels…</p>}
      {suivi.isError && <p role="alert" className="text-sm text-red-700">Impossible de charger le suivi des appels.</p>}
      {suivi.isSuccess && (creneaux.length ? (
        <>
          <p role="status" className="mb-3 text-sm text-slate-600">{enregistres} / {creneaux.length} appels enregistrés</p>
          <ul className="divide-y divide-slate-200">
            {creneaux.map(({ creneau, enregistre }) => (
              <li key={creneau.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-medium">{creneau.matiere_classe.matieres?.nom ?? "Cours"}</p>
                  <p className="text-slate-600">
                    {creneau.heure_debut.slice(0, 5)}–{creneau.heure_fin.slice(0, 5)}
                    {creneau.professeur && ` · ${creneau.professeur.prenom} ${creneau.professeur.nom}`}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${enregistre ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                  {enregistre ? "Appel enregistré" : "À faire"}
                </span>
                {enregistre && (
                  <Button variant="secondary" onClick={() => choisirSeance(date, creneau.id)}>
                    Voir les signalements <span className="sr-only">{creneau.matiere_classe.matieres?.nom ?? "Cours"} à {creneau.heure_debut.slice(0, 5)}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : <EmptyState message="Aucun créneau prévu pour cette classe à cette date." />)}
    </Card>
  );
}

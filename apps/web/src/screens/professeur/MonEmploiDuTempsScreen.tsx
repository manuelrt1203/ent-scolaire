import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useCreneaux, getAnneeScolaireActive, buildEmploiDuTempsIcs } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { AppelSeance } from "./AppelSeance";
import { telechargerFichierTexte } from "../../lib/telechargerFichier";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function MonEmploiDuTempsScreen() {
  const { client, profile } = useAuth();
  const creneauxQuery = useCreneaux(client);
  const [parametres, setParametres] = useSearchParams();
  const creneauAppel = creneauxQuery.data?.find(({ id, professeur_id }) =>
    id === parametres.get("appel") && professeur_id === profile?.id
  );

  function afficherAppel(id: string | null) {
    setParametres((actuels) => {
      const suivants = new URLSearchParams(actuels);
      if (id) suivants.set("appel", id);
      else suivants.delete("appel");
      return suivants;
    });
  }
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  function handleExporterIcs() {
    if (!creneauxQuery.data || !anneeQuery.data) return;
    const ics = buildEmploiDuTempsIcs(
      creneauxQuery.data.map((c) => ({
        id: c.id,
        jour_semaine: c.jour_semaine,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        matiere: c.matiere_classe?.matieres?.nom ?? "Cours",
        detail: c.matiere_classe?.classes?.nom,
      })),
      anneeQuery.data,
    );
    telechargerFichierTexte(ics, "emploi-du-temps.ics", "text/calendar");
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Mon emploi du temps" description="Votre emploi du temps de la semaine." />
        <Button
          variant="secondary"
          onClick={handleExporterIcs}
          disabled={!creneauxQuery.data?.length || !anneeQuery.data}
        >
          Exporter (.ics)
        </Button>
      </div>
      {creneauAppel && (
        <AppelSeance key={creneauAppel.id} creneau={creneauAppel}
          jour={JOURS[creneauAppel.jour_semaine - 1]} fermer={() => afficherAppel(null)} />
      )}
      <Card className="overflow-x-auto">
        {creneauxQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Jour</th>
                <th className="px-4 py-2">Horaire</th>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Salle</th>
                <th className="px-4 py-2">Appel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creneauxQuery.data.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                  <td className="px-4 py-2 text-slate-500">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
                  <td className="px-4 py-2">
                    {c.professeur_id === profile?.id && (
                      <Button variant="secondary" className="whitespace-nowrap" onClick={() => afficherAppel(c.id)}>
                        Faire l’appel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun créneau renseigné." />
        )}
      </Card>
    </div>
  );
}

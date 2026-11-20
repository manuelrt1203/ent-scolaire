import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getBulletin, getClasseEleve, getCreneaux, libelleClasse, useAuth,
  useEtablissementCalendrier, usePeriodes, useRelevesForDirection, useVieScolaireEleve,
} from "@ent/shared";
import { useParentChild } from "../lib/ParentChildContext";
import { ChildSwitcher } from "./ChildSwitcher";
import { IconArrowRight, IconBookOpen, IconClipboard, IconShield, type IconComponent } from "./icons";

function Carte({ titre, lien, action, icone: Icon, enfants }: {
  titre: string; lien: string; action: string; icone: IconComponent; enfants: ReactNode;
}) {
  return (
    <Link to={lien} className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-600/50 focus-visible:outline-2 focus-visible:outline-teal-700 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800"><Icon className="size-5" aria-hidden /></span>
        <h2 className="text-sm font-semibold text-midnight-ink">{titre}</h2>
      </div>
      <div className="my-4 flex-1 text-sm text-slate-600">{enfants}</div>
      <span className="flex items-center gap-2 text-sm font-semibold text-teal-800">
        {action}<IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

export function PrioritesDirection() {
  const { client } = useAuth();
  const releves = useRelevesForDirection(client, ["soumise", "validee"]);
  const aValider = releves.data?.filter(({ statut }) => statut === "soumise").length ?? 0;
  const aPublier = releves.data?.filter(({ statut }) => statut === "validee").length ?? 0;
  return (
    <section aria-label="Priorités de la direction" className="grid gap-3 sm:grid-cols-3">
      <Carte titre="Relevés à valider" lien="/direction/releves" action="Examiner les relevés" icone={IconClipboard}
        enfants={releves.isSuccess ? <><strong className="block text-3xl font-semibold tabular-nums text-midnight-ink">{aValider}</strong>Reçus des professeurs</> : <p>{releves.isError ? "Nombre indisponible" : "Chargement…"}</p>} />
      <Carte titre="Relevés à publier" lien="/direction/releves" action="Suivre la publication" icone={IconBookOpen}
        enfants={releves.isSuccess ? <><strong className="block text-3xl font-semibold tabular-nums text-midnight-ink">{aPublier}</strong>Validés par la direction</> : <p>{releves.isError ? "Nombre indisponible" : "Chargement…"}</p>} />
      <Carte titre="Bulletins" lien="/direction/inscriptions" action="Ouvrir les inscriptions" icone={IconShield}
        enfants={<p>Imprimer, exporter et suivre la remise par classe.</p>} />
    </section>
  );
}

const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const joursAnglais = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function prochainCreneau<T extends { jour_semaine: number; heure_debut: string }>(creneaux: T[], maintenant: Date, timeZone?: string) {
  const format = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });
  const parties = Object.fromEntries(format.formatToParts(maintenant).map(({ type, value }) => [type, value]));
  const jour = joursAnglais.indexOf(parties.weekday);
  const minute = Number(parties.hour) * 60 + Number(parties.minute);
  return creneaux.map((creneau) => {
    const [heure, minutes] = creneau.heure_debut.split(":").map(Number);
    const delta = ((creneau.jour_semaine % 7 - jour + 7) % 7) * 1440 + heure * 60 + minutes - minute;
    return { creneau, distance: delta < 0 ? delta + 7 * 1440 : delta };
  }).sort((a, b) => a.distance - b.distance)[0]?.creneau;
}

export function PrioritesParent() {
  const { client, profile } = useAuth();
  const { enfants, selectedId } = useParentChild();
  const enfant = enfants.find(({ id }) => id === selectedId);
  const { fuseau, charge } = useEtablissementCalendrier(client, profile);
  const classeQuery = useQuery({
    queryKey: ["classe-eleve", enfant?.id ?? null],
    queryFn: () => getClasseEleve(client, enfant!.id),
    enabled: Boolean(enfant),
  });
  const classeId = classeQuery.data?.classe_id;
  const coursQuery = useQuery({
    queryKey: ["creneaux", null, classeId ?? null],
    queryFn: () => getCreneaux(client, { classeId }),
    enabled: Boolean(classeId),
  });
  const vie = useVieScolaireEleve(client, enfant?.id ?? null);
  const periodes = usePeriodes(client);
  const bulletin = useQuery({
    queryKey: ["bulletin", "dernier", enfant?.id, periodes.data?.map(({ id }) => id)],
    queryFn: async () => {
      const recentes = [...(periodes.data ?? [])].sort((a, b) => b.date_debut.localeCompare(a.date_debut) || b.ordre - a.ordre);
      for (const periode of recentes) {
        if ((await getBulletin(client, enfant!.id, periode.id)).some(({ moyenne }) => moyenne != null)) return periode;
      }
      return null;
    },
    enabled: Boolean(enfant) && periodes.isSuccess,
  });

  if (!enfant) return <p className="mt-4 text-sm text-slate-600">Le suivi s’affiche quand un enfant est rattaché à votre compte.</p>;
  const prochain = charge ? prochainCreneau(coursQuery.data ?? [], new Date(), fuseau?.identifiant) : undefined;
  const absences = vie.data?.filter((evenement) => evenement.type === "absence" && !evenement.justifie && !evenement.justificatif_chemin).length ?? 0;

  return (
    <section aria-label="Suivi de l’enfant" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold text-midnight-ink">{enfant.prenom} {enfant.nom}</h2>
          {classeQuery.data?.classes && <p className="text-sm text-slate-600">{libelleClasse(classeQuery.data.classes)}</p>}
        </div>
        <ChildSwitcher />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Carte titre="Prochain cours" lien="/parent/emploi-du-temps" action="Voir l’emploi du temps" icone={IconClipboard} enfants={
          prochain ? <><strong className="block text-base text-midnight-ink">{prochain.matiere_classe?.matieres?.nom ?? "Cours"}</strong>
            {jours[prochain.jour_semaine % 7]} · {prochain.heure_debut.slice(0, 5)}{prochain.salle ? ` · Salle ${prochain.salle}` : ""}</>
            : <p>{classeQuery.isError || coursQuery.isError ? "Emploi du temps indisponible" : classeQuery.isLoading || coursQuery.isLoading ? "Chargement…" : "Aucun créneau affiché"}</p>
        } />
        <Carte titre="Dernier bulletin disponible" lien={bulletin.data ? `/parent/notes?periode=${bulletin.data.id}` : "/parent/notes"} action="Voir les notes" icone={IconBookOpen} enfants={
          <p>{bulletin.data?.nom ?? (bulletin.isError || periodes.isError ? "Résultats indisponibles" : bulletin.isPending ? "Chargement…" : "Aucun résultat publié")}</p>
        } />
        <Carte titre="Absences à justifier" lien="/parent/vie-scolaire" action="Voir la vie scolaire" icone={IconShield} enfants={
          vie.isSuccess ? <strong className="text-2xl font-semibold tabular-nums text-midnight-ink">{absences}</strong> : <p>{vie.isError ? "Suivi indisponible" : "Chargement…"}</p>
        } />
      </div>
    </section>
  );
}

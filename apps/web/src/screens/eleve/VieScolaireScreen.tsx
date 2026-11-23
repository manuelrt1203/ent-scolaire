import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth, useVieScolaireEleve, useUploaderJustificatifAbsence, getJustificatifSignedUrl, FORMATS_JUSTIFICATIF_ACCEPTES, libelleSeanceVieScolaire } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { statutJustificatif, LIBELLES_JUSTIFICATIF } from "../../lib/statutJustificatif";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

const TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  sanction: "Sanction",
};

const FILTRES = [
  { valeur: "", libelle: "Tous les événements" },
  { valeur: "absences-a-justifier", libelle: "Absences à justifier" },
  { valeur: "justificatifs-envoyes", libelle: "En attente de traitement" },
  { valeur: "retards", libelle: "Retards" },
  { valeur: "sanctions", libelle: "Sanctions" },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { timeZone: "UTC" });
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const eleveId = useViewedEleveId();
  const vieScolaireQuery = useVieScolaireEleve(client, eleveId);
  const uploaderJustificatif = useUploaderJustificatifAbsence(client);
  const [envoiEnCoursPourId, setEnvoiEnCoursPourId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cibleUpload = useRef<{ evenementId: string; eleveId: string } | null>(null);
  const [erreurLecture, setErreurLecture] = useState("");

  const [filtres, setFiltres] = useSearchParams();
  const filtre = FILTRES.find(({ valeur }) => valeur === filtres.get("filtre"))?.valeur ?? "";
  const [envoiConfirmePour, setEnvoiConfirmePour] = useState<string | null>(null);
  const evenements = vieScolaireQuery.data ?? [];
  const affiches = evenements.filter((evenement) => {
    switch (filtre) {
      case "absences-a-justifier":
        return evenement.type === "absence" && ["a_justifier", "refuse"].includes(statutJustificatif(evenement) ?? "");
      case "justificatifs-envoyes":
        return statutJustificatif(evenement) === "a_examiner";
      case "retards":
        return evenement.type === "retard";
      case "sanctions":
        return evenement.type === "sanction";
      default:
        return true;
    }
  });

  function handleChoisirFichier(vieScolaireId: string) {
    if (!eleveId || envoiEnCoursPourId) return;
    cibleUpload.current = { evenementId: vieScolaireId, eleveId };
    fileInputRef.current?.click();
  }

  function handleFichierSelectionne(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const cible = cibleUpload.current;
    cibleUpload.current = null;
    if (!file || !cible || cible.eleveId !== eleveId || envoiEnCoursPourId) return;
    setEnvoiConfirmePour(null);
    setEnvoiEnCoursPourId(cible.evenementId);
    uploaderJustificatif.mutate(
      { vieScolaireId: cible.evenementId, file },
      {
        onSuccess: () => setEnvoiConfirmePour(cible.eleveId),
        onSettled: () => setEnvoiEnCoursPourId(null),
      },
    );
  }

  async function handleVoirJustificatif(chemin: string) {
    setErreurLecture("");
    try {
      const url = await getJustificatifSignedUrl(client, chemin);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setErreurLecture("Impossible d’ouvrir le justificatif.");
    }
  }

  return (
    <div className="max-w-2xl">
      {profile?.role === "parent" && <ChildSwitcher />}
      <PageHeader title="Vie scolaire" description="Absences, retards et sanctions." />
      {eleveId && vieScolaireQuery.isSuccess && (
        <div role="group" aria-label="Filtrer les événements" className="mb-4 flex flex-wrap gap-2">
          {FILTRES.map(({ valeur, libelle }) => (
            <button
              key={valeur}
              type="button"
              aria-pressed={filtre === valeur}
              onClick={() => setFiltres((actuels) => {
                const suivants = new URLSearchParams(actuels);
                if (valeur) suivants.set("filtre", valeur);
                else suivants.delete("filtre");
                return suivants;
              }, { replace: true })}
              className={`rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${
                filtre === valeur ? "border-ent-accent bg-ent-tint font-semibold text-ent-accent" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>
      )}
      {eleveId && envoiConfirmePour === eleveId && (
        <p role="status" className="mb-4 text-sm font-medium text-ent-accent">Le justificatif a bien été transmis à l’établissement.</p>
      )}
      <input ref={fileInputRef} type="file" accept={FORMATS_JUSTIFICATIF_ACCEPTES} className="hidden" onChange={handleFichierSelectionne} />
      {vieScolaireQuery.isError && <p role="alert" className="mb-4 text-sm text-red-700">Impossible de charger la vie scolaire.</p>}
      {eleveId && vieScolaireQuery.isPending && <p role="status" className="mb-4 text-sm text-slate-600">Chargement…</p>}
      {(uploaderJustificatif.isError || erreurLecture) && (
        <p role="alert" className="mb-4 text-sm text-red-700">{erreurLecture || (uploaderJustificatif.error instanceof Error ? uploaderJustificatif.error.message : "L’envoi du justificatif a échoué. Vous pouvez réessayer.")}</p>
      )}
      <div className="space-y-3">
        {affiches.map((v) => {
          const statut = statutJustificatif(v);
          const seance = libelleSeanceVieScolaire(v.creneau);
          return (
            <Card key={v.id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{TYPE_LABELS[v.type]}</span>
                <time dateTime={v.date} className="text-xs text-slate-500">{formatDate(v.date)}</time>
              </div>
              {seance && <p className="mb-1 break-words text-sm text-slate-700">{seance}</p>}
              {v.type === "sanction" && v.description && <p className="text-sm text-slate-700">{v.description}</p>}
              {v.type === "retard" && v.duree_minutes != null && <p className="text-sm text-slate-700">{v.duree_minutes} min</p>}
              {statut && (
                <>
                  <p className={`mt-1 text-xs ${v.justifie ? "text-emerald-600" : "text-amber-600"}`}>
                    {statut === "a_examiner" ? "Justificatif envoyé · en attente de validation" : LIBELLES_JUSTIFICATIF[statut]}
                    {v.motif ? ` · ${v.motif}` : ""}
                  </p>
                  {v.justificatif_motif_refus && <p className="mt-1 break-words text-sm text-red-700">{v.justificatif_motif_refus}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {v.justificatif_chemin ? (
                      <Button variant="ghost" onClick={() => handleVoirJustificatif(v.justificatif_chemin!)}>
                        Voir le justificatif
                      </Button>
                    ) : null}
                    {(statut === "a_justifier" || statut === "refuse") && (
                      <Button
                        aria-describedby={`formats-${v.id}`}
                        variant="secondary"
                        onClick={() => handleChoisirFichier(v.id)}
                        disabled={Boolean(envoiEnCoursPourId)}
                      >
                        {envoiEnCoursPourId === v.id ? "Envoi…" : statut === "refuse" ? "Ajouter un nouveau justificatif" : "Ajouter un justificatif"}
                      </Button>
                    )}
                  </div>
                  {(statut === "a_justifier" || statut === "refuse") && (
                    <p id={`formats-${v.id}`} className="mt-1 text-xs text-slate-600">
                      Photo (JPG, PNG, WebP, HEIC, HEIF) ou PDF.
                    </p>
                  )}
                </>
              )}
            </Card>
          );
        })}
        {vieScolaireQuery.isSuccess && affiches.length === 0 && (
          <EmptyState message={filtre === "absences-a-justifier"
            ? "Aucune absence à justifier."
            : filtre ? "Aucun événement pour ce filtre." : "Aucun événement de vie scolaire."} />
        )}
      </div>
    </div>
  );
}

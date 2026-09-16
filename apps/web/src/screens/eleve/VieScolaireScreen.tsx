import { useRef, useState } from "react";
import { useAuth, useVieScolaireEleve, useUploaderJustificatifAbsence, getJustificatifSignedUrl } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

const TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  sanction: "Sanction",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();
  const vieScolaireQuery = useVieScolaireEleve(client, eleveId);
  const uploaderJustificatif = useUploaderJustificatifAbsence(client);
  const [envoiEnCoursPourId, setEnvoiEnCoursPourId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cibleUpload, setCibleUpload] = useState<string | null>(null);

  function handleChoisirFichier(vieScolaireId: string) {
    setCibleUpload(vieScolaireId);
    fileInputRef.current?.click();
  }

  function handleFichierSelectionne(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !cibleUpload) return;
    setEnvoiEnCoursPourId(cibleUpload);
    uploaderJustificatif.mutate(
      { vieScolaireId: cibleUpload, file },
      { onSettled: () => setEnvoiEnCoursPourId(null) },
    );
  }

  async function handleVoirJustificatif(chemin: string) {
    const url = await getJustificatifSignedUrl(client, chemin);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Vie scolaire" description="Absences, retards et sanctions." />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFichierSelectionne} />
      <div className="space-y-3">
        {vieScolaireQuery.data?.map((v: any) => (
          <Card key={v.id} className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{TYPE_LABELS[v.type]}</span>
              <span className="text-xs text-slate-400">{formatDate(v.date)}</span>
            </div>
            {v.type === "sanction" && v.description && <p className="text-sm text-slate-700">{v.description}</p>}
            {v.type === "retard" && v.duree_minutes != null && <p className="text-sm text-slate-700">{v.duree_minutes} min</p>}
            {v.type !== "sanction" && (
              <>
                <p className={`mt-1 text-xs ${v.justifie ? "text-emerald-600" : "text-amber-600"}`}>
                  {v.justifie ? "Justifié" : "Non justifié"}
                  {v.motif ? ` · ${v.motif}` : ""}
                </p>
                <div className="mt-2">
                  {v.justificatif_chemin ? (
                    <Button variant="ghost" onClick={() => handleVoirJustificatif(v.justificatif_chemin)}>
                      Voir le justificatif
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleChoisirFichier(v.id)}
                      disabled={envoiEnCoursPourId === v.id}
                    >
                      {envoiEnCoursPourId === v.id ? "Envoi…" : "Ajouter un justificatif"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        ))}
        {vieScolaireQuery.data?.length === 0 && <EmptyState message="Aucun événement de vie scolaire." />}
      </div>
    </div>
  );
}

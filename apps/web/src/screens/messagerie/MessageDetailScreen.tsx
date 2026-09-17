import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAuth,
  useMessageThread,
  useMarquerCommeLu,
  useSupprimerDeReception,
  useSupprimerMessageEnvoye,
  getPieceJointeSignedUrl,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

function formatTaille(octets: number | null) {
  if (!octets) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function MessageDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, profile } = useAuth();

  const threadQuery = useMessageThread(client, id ?? null);
  const marquerLu = useMarquerCommeLu(client);
  const supprimer = useSupprimerDeReception(client);
  const supprimerEnvoye = useSupprimerMessageEnvoye(client);

  const thread = threadQuery.data ?? [];
  const mesLignesNonLues = thread
    .map((m: any) => m.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id))
    .filter((row: any) => row && !row.lu);
  const cleNonLues = mesLignesNonLues.map((r: any) => r.id).join(",");

  useEffect(() => {
    mesLignesNonLues.forEach((row: any) => marquerLu.mutate(row.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleNonLues]);

  if (thread.length === 0) return <p className="text-sm text-slate-500">Chargement…</p>;

  const root = thread[0];
  const dernierAutre = [...thread].reverse().find((m: any) => m.expediteur_id !== profile?.id);
  const destinataireReponse = dernierAutre?.expediteur_id ?? root.message_destinataires?.[0]?.destinataire_id;

  async function handleTelechargerPieceJointe(cheminFichier: string) {
    const url = await getPieceJointeSignedUrl(client, cheminFichier);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>← Retour</Button>

      <h1 className="mb-6 text-lg font-semibold text-slate-900">{root.sujet}</h1>

      <div className="mb-6 space-y-4">
        {thread.map((m: any) => {
          const estMoi = m.expediteur_id === profile?.id;
          const mesDestinataires = m.message_destinataires ?? [];
          return (
            <Card key={m.id} tinted={estMoi} className="p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {estMoi ? "Vous" : `${m.expediteur?.prenom} ${m.expediteur?.nom}`}
                  <span className="ml-1 text-xs font-normal text-slate-400">({ROLE_LABELS[m.expediteur?.role]})</span>
                </p>
                <p className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <p className="mb-2 text-xs text-slate-400">
                À : {mesDestinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{m.corps}</p>
              {m.message_pieces_jointes?.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3">
                  {m.message_pieces_jointes.map((pj: any) => (
                    <button
                      key={pj.id}
                      onClick={() => handleTelechargerPieceJointe(pj.chemin_fichier)}
                      className="flex items-center gap-2 text-xs text-indigo-ink hover:underline"
                    >
                      {pj.nom_fichier}
                      {pj.taille_octets ? <span className="text-slate-400">({formatTaille(pj.taille_octets)})</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() =>
            navigate("../../messagerie/nouveau", {
              state: {
                destinataireId: destinataireReponse,
                sujet: root.sujet.startsWith("Re: ") ? root.sujet : `Re: ${root.sujet}`,
                parentMessageId: root.id,
              },
            })
          }
        >
          Répondre
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            thread.forEach((m: any) => {
              if (m.expediteur_id === profile?.id) {
                supprimerEnvoye.mutate(m.id);
                return;
              }
              const row = m.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id);
              if (row) supprimer.mutate(row.id);
            });
            navigate("../../messagerie");
          }}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}

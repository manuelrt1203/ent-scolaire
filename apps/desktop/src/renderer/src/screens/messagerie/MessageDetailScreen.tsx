import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useMessageDetail, useMarquerCommeLu, useSupprimerDeReception } from "@ent/shared";

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

  const messageQuery = useMessageDetail(client, id ?? null);
  const marquerLu = useMarquerCommeLu(client);
  const supprimer = useSupprimerDeReception(client);

  const message = messageQuery.data;
  const monDestinataireRow = message?.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id);

  useEffect(() => {
    if (monDestinataireRow && !monDestinataireRow.lu) {
      marquerLu.mutate(monDestinataireRow.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monDestinataireRow?.id]);

  if (!message) return <p className="text-sm text-slate-500">Chargement…</p>;

  const estExpediteur = message.expediteur_id === profile?.id;

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 text-xs text-slate-500 underline">
        ← Retour
      </button>

      <h1 className="mb-1 text-lg font-semibold text-slate-900">{message.sujet}</h1>
      <p className="mb-1 text-sm text-slate-600">
        De : {message.expediteur?.prenom} {message.expediteur?.nom}{" "}
        <span className="text-xs text-slate-400">({ROLE_LABELS[message.expediteur?.role]})</span>
      </p>
      <p className="mb-4 text-xs text-slate-400">
        À : {message.message_destinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
        {" · "}
        {new Date(message.created_at).toLocaleString("fr-FR")}
      </p>

      <div className="mb-6 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800">
        {message.corps}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() =>
            navigate("../../messagerie/nouveau", {
              state: {
                destinataireId: estExpediteur ? undefined : message.expediteur_id,
                sujet: message.sujet.startsWith("Re: ") ? message.sujet : `Re: ${message.sujet}`,
              },
            })
          }
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Répondre
        </button>
        {!estExpediteur && monDestinataireRow && (
          <button
            onClick={() => {
              supprimer.mutate(monDestinataireRow.id);
              navigate("../../messagerie");
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

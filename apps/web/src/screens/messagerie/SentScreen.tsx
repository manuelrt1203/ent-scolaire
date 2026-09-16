import { Link } from "react-router-dom";
import { useAuth, useMessagesEnvoyes, useSupprimerMessageEnvoye } from "@ent/shared";
import { MessagerieTabs } from "./MessagerieTabs";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState } from "../../components/ui/Card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function SentScreen() {
  const { client } = useAuth();
  const sentQuery = useMessagesEnvoyes(client);
  const supprimer = useSupprimerMessageEnvoye(client);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Messagerie</h1>

      <MessagerieTabs receptionHref=".." envoyesHref="." />

      <Card className="overflow-x-auto">
        {sentQuery.data?.length ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {sentQuery.data.map((m: any) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <Link to={`../messagerie/${m.id}`} className="block">
                      <p className="text-sm text-slate-500">
                        À : {m.message_destinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
                      </p>
                      <p className="text-sm font-medium text-slate-900">{m.sujet}</p>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-slate-400">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => supprimer.mutate(m.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun message envoyé." />
        )}
      </Card>
    </div>
  );
}

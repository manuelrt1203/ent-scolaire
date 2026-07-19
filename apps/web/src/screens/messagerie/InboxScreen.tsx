import { Link } from "react-router-dom";
import { useAuth, useBoiteReception, useSupprimerDeReception } from "@ent/shared";
import { MessagerieTabs } from "./MessagerieTabs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function InboxScreen() {
  const { client } = useAuth();
  const inboxQuery = useBoiteReception(client);
  const supprimer = useSupprimerDeReception(client);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Messagerie</h1>
        <Link to="../messagerie/nouveau" className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white">
          Nouveau message
        </Link>
      </div>

      <MessagerieTabs receptionHref="." envoyesHref="envoyes" />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {inboxQuery.data?.map((row: any) => (
              <tr key={row.id} className={row.lu ? "" : "bg-slate-50"}>
                <td className="w-0 px-4 py-3">
                  {!row.lu && <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />}
                </td>
                <td className="px-2 py-3">
                  <Link to={`../messagerie/${row.messages.id}`} className="block">
                    <p className={`text-sm ${row.lu ? "text-slate-600" : "font-semibold text-slate-900"}`}>
                      {row.messages.expediteur?.prenom} {row.messages.expediteur?.nom}
                    </p>
                    <p className={`text-sm ${row.lu ? "text-slate-500" : "text-slate-800"}`}>{row.messages.sujet}</p>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-slate-400">
                  {formatDate(row.messages.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => supprimer.mutate(row.id)}
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {inboxQuery.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Boîte de réception vide.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDateOfficielle, useAuth, useDatesOfficielles } from "@ent/shared";
import { Card } from "../ui/Card";

const APERCU = 5;

/** Vacances scolaires (académie de l'établissement) + jours fériés à venir, en lecture seule. */
export function DatesOfficielles() {
  const { client, profile } = useAuth();
  const { data, isLoading, isError, academie, academieChargee, calendrierOfficielFrance } = useDatesOfficielles(client, profile);
  const [toutVoir, setToutVoir] = useState(false);

  if (!calendrierOfficielFrance || isLoading || !academieChargee) return null;

  const dates = toutVoir ? data ?? [] : (data ?? []).slice(0, APERCU);

  return (
    <Card className="mb-6 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Vacances et jours fériés</h2>
        {academie && <span className="text-xs text-slate-400">Académie de {academie}</span>}
      </div>

      {!academie && (
        <p className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          {profile?.role === "direction" ? (
            <>
              Seuls les jours fériés sont affichés.{" "}
              <Link to="/direction/parametres" className="font-medium underline">Choisir l'académie</Link>{" "}
              pour ajouter les vacances scolaires.
            </>
          ) : (
            "Seuls les jours fériés sont affichés : l'établissement n'a pas encore renseigné son académie."
          )}
        </p>
      )}

      {isError ? (
        <p className="text-xs text-slate-400">Dates officielles indisponibles pour le moment.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {dates.map((d) => (
            <li key={d.id} className="flex items-start gap-3 py-2">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${d.type === "vacances" ? "bg-emerald-500" : "bg-amber-500"}`}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm text-slate-900">{d.titre}</p>
                <p className="text-xs text-slate-500">{formatDateOfficielle(d)}</p>
              </div>
              <span className="ml-auto shrink-0 text-[11px] text-slate-400">{d.type === "vacances" ? "Vacances" : "Férié"}</span>
            </li>
          ))}
        </ul>
      )}

      {!isError && (data?.length ?? 0) > APERCU && (
        <button onClick={() => setToutVoir((v) => !v)} className="mt-2 text-xs font-medium text-indigo-ink hover:underline">
          {toutVoir ? "Réduire" : `Afficher les ${data!.length} dates de l'année`}
        </button>
      )}
    </Card>
  );
}

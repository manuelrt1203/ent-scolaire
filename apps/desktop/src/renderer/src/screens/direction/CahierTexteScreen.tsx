import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasses, useCahierTexteClasse } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function CahierTexteScreen() {
  const { client } = useAuth();
  const [classeId, setClasseId] = useState("");
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const cahierQuery = useCahierTexteClasse(client, classeId || null);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Cahier de textes</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-600">Classe</label>
        <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">—</option>
          {classesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {classeId && (
        <div className="space-y-3">
          {cahierQuery.data?.map((entree: any) => (
            <div key={entree.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm font-medium text-slate-900">
                {formatDate(entree.date_seance)} — {entree.matiere_classe?.matieres?.nom}
              </p>
              {entree.contenu_seance && <p className="mb-1 text-sm text-slate-700">{entree.contenu_seance}</p>}
              {entree.travail_a_faire && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Travail à faire :</span> {entree.travail_a_faire}
                  {entree.date_echeance && ` (pour le ${formatDate(entree.date_echeance)})`}
                </p>
              )}
            </div>
          ))}
          {cahierQuery.data?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">Aucune entrée pour cette classe.</p>
          )}
        </div>
      )}
    </div>
  );
}

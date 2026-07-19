import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasses, useRessourcesClasse, getRessourceSignedUrl } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatTaille(octets: number | null) {
  if (!octets) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function RessourcesScreen() {
  const { client } = useAuth();
  const [classeId, setClasseId] = useState("");
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const ressourcesQuery = useRessourcesClasse(client, classeId || null);

  async function handleTelecharger(cheminFichier: string) {
    const url = await getRessourceSignedUrl(client, cheminFichier);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Ressources pédagogiques</h1>

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
          {ressourcesQuery.data?.map((ressource: any) => (
            <div key={ressource.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {ressource.titre} — {ressource.matiere_classe?.matieres?.nom}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(ressource.created_at)}
                  {ressource.taille_octets ? ` · ${formatTaille(ressource.taille_octets)}` : ""}
                </p>
              </div>
              <button onClick={() => handleTelecharger(ressource.chemin_fichier)} className="text-xs text-slate-500 hover:text-slate-900">
                Télécharger
              </button>
            </div>
          ))}
          {ressourcesQuery.data?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">Aucune ressource pour cette classe.</p>
          )}
        </div>
      )}
    </div>
  );
}

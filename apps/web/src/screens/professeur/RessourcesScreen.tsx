import { useRef, useState, type FormEvent } from "react";
import {
  useAuth,
  useMesAffectations,
  useRessources,
  useUploadRessource,
  useDeleteRessource,
  getRessourceSignedUrl,
} from "@ent/shared";

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
  const { client, profile } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [titre, setTitre] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const ressourcesQuery = useRessources(client, matiereClasseId || null);
  const uploadRessource = useUploadRessource(client);
  const supprimerRessource = useDeleteRessource(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    const file = fileInputRef.current?.files?.[0];
    if (!matiereClasseId || !file || !profile) return;
    uploadRessource.mutate(
      { matiereClasseId, professeurId: profile.id, titre, file },
      {
        onSuccess: () => {
          setTitre("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: (err: unknown) => setErreur(err instanceof Error ? err.message : "Échec de l'envoi"),
      },
    );
  }

  async function handleTelecharger(cheminFichier: string) {
    const url = await getRessourceSignedUrl(client, cheminFichier);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Ressources pédagogiques</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-600">Matière / Classe</label>
        <select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">—</option>
          {affectationsQuery.data?.map((a: any) => (
            <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
              {a.matiere_classe.matieres?.nom} — {a.matiere_classe.classes?.nom}
            </option>
          ))}
        </select>
      </div>

      {matiereClasseId && (
        <>
          <form onSubmit={handleSubmit} className="mb-8 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Titre</label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fichier</label>
              <input ref={fileInputRef} type="file" required className="w-full text-sm" />
            </div>
            {erreur && <p className="text-sm text-red-600">{erreur}</p>}
            <button type="submit" disabled={uploadRessource.isPending} className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {uploadRessource.isPending ? "Envoi…" : "Déposer"}
            </button>
          </form>

          <div className="space-y-3">
            {ressourcesQuery.data?.map((ressource) => (
              <div key={ressource.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ressource.titre}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(ressource.created_at)}
                    {ressource.taille_octets ? ` · ${formatTaille(ressource.taille_octets)}` : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleTelecharger(ressource.chemin_fichier)} className="text-xs text-slate-500 hover:text-slate-900">
                    Télécharger
                  </button>
                  <button
                    onClick={() => supprimerRessource.mutate({ id: ressource.id, cheminFichier: ressource.chemin_fichier })}
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {ressourcesQuery.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">Aucune ressource pour cette matière/classe.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useAuth, useMesAffectations, useCahierTexteMatiereClasse, useCreateEntreeCahierTexte, useDeleteEntreeCahierTexte } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function CahierTexteScreen() {
  const { client } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [dateSeance, setDateSeance] = useState(() => new Date().toISOString().slice(0, 10));
  const [contenuSeance, setContenuSeance] = useState("");
  const [travailAFaire, setTravailAFaire] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");

  const cahierQuery = useCahierTexteMatiereClasse(client, matiereClasseId || null);
  const creerEntree = useCreateEntreeCahierTexte(client);
  const supprimerEntree = useDeleteEntreeCahierTexte(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matiereClasseId) return;
    creerEntree.mutate(
      {
        matiere_classe_id: matiereClasseId,
        date_seance: dateSeance,
        contenu_seance: contenuSeance || null,
        travail_a_faire: travailAFaire || null,
        date_echeance: dateEcheance || null,
      },
      {
        onSuccess: () => {
          setContenuSeance("");
          setTravailAFaire("");
          setDateEcheance("");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Cahier de textes</h1>

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
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date de séance</label>
                <input type="date" value={dateSeance} onChange={(e) => setDateSeance(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Devoirs à rendre pour le</label>
                <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Contenu de la séance</label>
              <textarea value={contenuSeance} onChange={(e) => setContenuSeance(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Travail à faire</label>
              <textarea value={travailAFaire} onChange={(e) => setTravailAFaire(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={creerEntree.isPending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Ajouter
            </button>
          </form>

          <div className="space-y-3">
            {cahierQuery.data?.map((entree: any) => (
              <div key={entree.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{formatDate(entree.date_seance)}</p>
                  <button onClick={() => supprimerEntree.mutate(entree.id)} className="text-xs text-slate-400 hover:text-red-600">
                    Supprimer
                  </button>
                </div>
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
              <p className="py-6 text-center text-sm text-slate-400">Aucune entrée pour cette matière/classe.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

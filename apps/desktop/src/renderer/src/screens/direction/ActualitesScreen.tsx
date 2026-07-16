import { useState, type FormEvent } from "react";
import { useAuth, useActualites, useCreateActualite, useDeleteActualite } from "@ent/shared";

const CIBLES: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "eleve", label: "Élèves" },
  { value: "parent", label: "Parents" },
  { value: "professeur", label: "Professeurs" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActualitesScreen() {
  const { client, profile } = useAuth();
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [cible, setCible] = useState("");

  const actualitesQuery = useActualites(client);
  const creerActualite = useCreateActualite(client);
  const supprimerActualite = useDeleteActualite(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !titre.trim() || !contenu.trim()) return;
    creerActualite.mutate(
      {
        etablissement_id: profile.etablissement_id,
        auteur_id: profile.id,
        titre,
        contenu,
        cible: (cible || null) as any,
      },
      {
        onSuccess: () => {
          setTitre("");
          setContenu("");
          setCible("");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Actualités</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Titre</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Contenu</label>
          <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={3} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Destinataires</label>
          <select value={cible} onChange={(e) => setCible(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {CIBLES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={creerActualite.isPending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Publier
        </button>
      </form>

      <div className="space-y-3">
        {actualitesQuery.data?.map((a: any) => (
          <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{a.titre}</p>
              <button onClick={() => supprimerActualite.mutate(a.id)} className="text-xs text-slate-400 hover:text-red-600">
                Supprimer
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {formatDate(a.created_at)} · {CIBLES.find((c) => c.value === (a.cible ?? ""))?.label ?? "Tous"}
            </p>
            <p className="text-sm text-slate-700">{a.contenu}</p>
          </div>
        ))}
        {actualitesQuery.data?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Aucune actualité publiée.</p>
        )}
      </div>
    </div>
  );
}

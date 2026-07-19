import { useState, type FormEvent } from "react";
import { useAuth, useEvenementsCalendrier, useCreateEvenementCalendrier, useDeleteEvenementCalendrier } from "@ent/shared";

const CIBLES: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "eleve", label: "Élèves" },
  { value: "parent", label: "Parents" },
  { value: "professeur", label: "Professeurs" },
];

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CalendrierScreen() {
  const { client, profile } = useAuth();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState(() => toDatetimeLocal(new Date()));
  const [dateFin, setDateFin] = useState(() => toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [lieu, setLieu] = useState("");
  const [cible, setCible] = useState("");

  const evenementsQuery = useEvenementsCalendrier(client);
  const creerEvenement = useCreateEvenementCalendrier(client);
  const supprimerEvenement = useDeleteEvenementCalendrier(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !titre.trim()) return;
    creerEvenement.mutate(
      {
        etablissement_id: profile.etablissement_id,
        auteur_id: profile.id,
        titre,
        description: description || null,
        date_debut: new Date(dateDebut).toISOString(),
        date_fin: new Date(dateFin).toISOString(),
        lieu: lieu || null,
        cible: (cible || null) as any,
      },
      {
        onSuccess: () => {
          setTitre("");
          setDescription("");
          setLieu("");
          setCible("");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Calendrier</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Titre</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Début</label>
            <input type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fin</label>
            <input type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lieu</label>
            <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Destinataires</label>
            <select value={cible} onChange={(e) => setCible(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {CIBLES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={creerEvenement.isPending} className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Ajouter
        </button>
      </form>

      <div className="space-y-3">
        {evenementsQuery.data?.map((e: any) => (
          <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{e.titre}</p>
              <button onClick={() => supprimerEvenement.mutate(e.id)} className="text-xs text-slate-400 hover:text-red-600">
                Supprimer
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {formatDateHeure(e.date_debut)} – {formatDateHeure(e.date_fin)}
              {e.lieu && ` · ${e.lieu}`} · {CIBLES.find((c) => c.value === (e.cible ?? ""))?.label ?? "Tous"}
            </p>
            {e.description && <p className="text-sm text-slate-700">{e.description}</p>}
          </div>
        ))}
        {evenementsQuery.data?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Aucun événement au calendrier.</p>
        )}
      </div>
    </div>
  );
}

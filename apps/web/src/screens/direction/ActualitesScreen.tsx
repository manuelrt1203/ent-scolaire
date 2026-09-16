import { useState, type FormEvent } from "react";
import { useAuth, useActualites, useCreateActualite, useDeleteActualite } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";

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
      <PageHeader title="Actualités" description="Publier des informations pour l'établissement." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Titre">
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} required />
          </Field>
          <Field label="Contenu">
            <Textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={3} required />
          </Field>
          <div className="w-48">
            <Field label="Destinataires">
              <Select value={cible} onChange={(e) => setCible(e.target.value)}>
                {CIBLES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={creerActualite.isPending}>Publier</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {actualitesQuery.data?.map((a: any) => (
          <Card key={a.id} className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{a.titre}</p>
              <Button variant="danger" onClick={() => supprimerActualite.mutate(a.id)}>Supprimer</Button>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {formatDate(a.created_at)} · {CIBLES.find((c) => c.value === (a.cible ?? ""))?.label ?? "Tous"}
            </p>
            <p className="text-sm text-slate-700">{a.contenu}</p>
          </Card>
        ))}
        {actualitesQuery.data?.length === 0 && <EmptyState message="Aucune actualité publiée." />}
      </div>
    </div>
  );
}

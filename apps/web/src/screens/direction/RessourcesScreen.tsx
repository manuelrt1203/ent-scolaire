import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { libelleClasse, useAuth, getClasses, useRessourcesClasse, getRessourceSignedUrl } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

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
      <PageHeader title="Ressources pédagogiques" description="Documents déposés par les professeurs." />

      <Card className="mb-6 p-4">
        <Field label="Classe">
          <Select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
            <option value="">—</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{libelleClasse(c)}</option>
            ))}
          </Select>
        </Field>
      </Card>

      {classeId && (
        <div className="space-y-3">
          {ressourcesQuery.data?.map((ressource: any) => (
            <Card key={ressource.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {ressource.titre} — {ressource.matiere_classe?.matieres?.nom}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(ressource.created_at)}
                  {ressource.taille_octets ? ` · ${formatTaille(ressource.taille_octets)}` : ""}
                </p>
              </div>
              <Button variant="ghost" onClick={() => handleTelecharger(ressource.chemin_fichier)}>Télécharger</Button>
            </Card>
          ))}
          {ressourcesQuery.data?.length === 0 && <EmptyState message="Aucune ressource pour cette classe." />}
        </div>
      )}
    </div>
  );
}

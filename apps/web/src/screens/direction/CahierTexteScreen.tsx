import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { libelleClasse, useAuth, getClasses, useCahierTexteClasse } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

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
      <PageHeader title="Cahier de textes" description="Suivre le contenu des séances par classe." />

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
          {cahierQuery.data?.map((entree: any) => (
            <Card key={entree.id} className="p-4">
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
            </Card>
          ))}
          {cahierQuery.data?.length === 0 && <EmptyState message="Aucune entrée pour cette classe." />}
        </div>
      )}
    </div>
  );
}

import { useRef, useState, type FormEvent } from "react";
import {
  useAuth,
  useMesAffectations,
  useRessources,
  useUploadRessource,
  useDeleteRessource,
  getRessourceSignedUrl,
  libelleClasse,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

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
      <PageHeader title="Ressources pédagogiques" description="Déposer des documents pour vos élèves." />

      <Card className="mb-6 p-4">
        <Field label="Matière / Classe">
          <Select value={matiereClasseId} onChange={(e) => setMatiereClasseId(e.target.value)}>
            <option value="">—</option>
            {affectationsQuery.data?.map((a: any) => (
              <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
                {a.matiere_classe.matieres?.nom} — {libelleClasse(a.matiere_classe.classes)}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {matiereClasseId && (
        <>
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Titre">
                <Input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
              </Field>
              <Field label="Fichier">
                <input ref={fileInputRef} type="file" required className="w-full text-sm" />
              </Field>
              {erreur && <p className="text-sm text-red-600">{erreur}</p>}
              <Button type="submit" disabled={uploadRessource.isPending}>
                {uploadRessource.isPending ? "Envoi…" : "Déposer"}
              </Button>
            </form>
          </Card>

          <div className="space-y-3">
            {ressourcesQuery.data?.map((ressource) => (
              <Card key={ressource.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ressource.titre}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(ressource.created_at)}
                    {ressource.taille_octets ? ` · ${formatTaille(ressource.taille_octets)}` : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => handleTelecharger(ressource.chemin_fichier)}>Télécharger</Button>
                  <Button
                    variant="danger"
                    onClick={() => supprimerRessource.mutate({ id: ressource.id, cheminFichier: ressource.chemin_fichier })}
                  >
                    Supprimer
                  </Button>
                </div>
              </Card>
            ))}
            {ressourcesQuery.data?.length === 0 && <EmptyState message="Aucune ressource pour cette matière/classe." />}
          </div>
        </>
      )}
    </div>
  );
}

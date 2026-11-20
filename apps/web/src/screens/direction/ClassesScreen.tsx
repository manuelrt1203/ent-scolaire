import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  createClasse,
  updateClasse,
  deleteClasse,
  getAnneeScolaireActive,
  CYCLE_LABELS,
  CYCLES_ORDRE,
  NIVEAUX_PAR_CYCLE,
  type CycleScolaire,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

export function ClassesScreen() {
  const { client, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [cycle, setCycle] = useState<CycleScolaire>("college");
  const [niveau, setNiveau] = useState(NIVEAUX_PAR_CYCLE.college[0]);
  const [serie, setSerie] = useState("");
  const [filtreCycle, setFiltreCycle] = useState<CycleScolaire | "">("");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createClasse(client, {
        nom,
        cycle,
        niveau,
        serie: serie.trim() || null,
        etablissement_id: profile!.etablissement_id,
        annee_scolaire_id: anneeQuery.data!.id,
      }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateClasse(client, editingId as string, { nom, cycle, niveau, serie: serie.trim() || null }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClasse(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setSerie("");
    setCycle("college");
    setNiveau(NIVEAUX_PAR_CYCLE.college[0]);
  }

  function handleCycleChange(nouveauCycle: CycleScolaire) {
    setCycle(nouveauCycle);
    setSerie("");
    setNiveau(NIVEAUX_PAR_CYCLE[nouveauCycle][0]);
  }

  function handleEdit(c: { id: string; nom: string; cycle: CycleScolaire; niveau: string; serie: string | null }) {
    setEditingId(c.id);
    setNom(c.nom);
    setCycle(c.cycle);
    setNiveau(c.niveau);
    setSerie(c.serie ?? "");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate();
    } else {
      if (!anneeQuery.data) return;
      createMutation.mutate();
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const classes = (classesQuery.data ?? []).filter((classe) => !filtreCycle || classe.cycle === filtreCycle);
  const erreur = createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Classes" description="Créer et organiser les classes de l'établissement." />

      <Card className="mb-8 p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field label="Cycle">
              <Select value={cycle} onChange={(e) => handleCycleChange(e.target.value as CycleScolaire)}>
                {CYCLES_ORDRE.map((c) => (
                  <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="w-32">
            <Field label="Niveau">
              <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                {NIVEAUX_PAR_CYCLE[cycle].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="min-w-[10rem] flex-1">
            <Field label="Nom de la classe">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="A, Bilingue, Terminale A…" />
            </Field>
          </div>
          {cycle === "lycee" && (
            <div className="w-40">
              <Field label="Série (facultative)">
                <Input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="A, C, D…" />
              </Field>
            </div>
          )}
          <Button type="submit" disabled={isPending || (!editingId && !anneeQuery.data)}>
            {editingId ? "Enregistrer" : "Ajouter"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Annuler
            </Button>
          )}
        </form>
        {erreur && <p role="alert" className="mt-3 text-sm text-red-700">{erreur.message}</p>}
      </Card>

      <div className="mb-3 w-48">
        <Field label="Filtrer par cycle">
          <Select value={filtreCycle} onChange={(e) => setFiltreCycle(e.target.value as CycleScolaire | "")}>
            <option value="">Tous les cycles</option>
            {CYCLES_ORDRE.map((c) => (
              <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Card className="overflow-x-auto">
        {classesQuery.isPending ? (
          <EmptyState message="Chargement des classes…" />
        ) : classesQuery.isError ? (
          <EmptyState message="Impossible de charger les classes." />
        ) : classes.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Cycle</th>
                <th className="px-4 py-2">Niveau</th>
                <th className="px-4 py-2">Série</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-slate-900">{c.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{CYCLE_LABELS[c.cycle]}</td>
                  <td className="px-4 py-2 text-slate-500">{c.niveau}</td>
                  <td className="px-4 py-2 text-slate-500">{c.serie ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(c)}>
                      Modifier
                    </Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(c.id)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message={filtreCycle ? "Aucune classe dans ce cycle." : "Aucune classe pour le moment."} />
        )}
      </Card>
    </div>
  );
}

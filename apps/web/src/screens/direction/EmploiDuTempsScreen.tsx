import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { libelleClasse, useAuth, getMatiereClasses, getAffectations, useCreneaux, useCreateCreneau, useDeleteCreneau } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client } = useAuth();
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [professeurId, setProfesseurId] = useState("");
  const [jourSemaine, setJourSemaine] = useState("1");
  const [heureDebut, setHeureDebut] = useState("08:00");
  const [heureFin, setHeureFin] = useState("09:00");
  const [salle, setSalle] = useState("");

  const mcQuery = useQuery({ queryKey: ["matiere-classes"], queryFn: () => getMatiereClasses(client) });
  const affectationsQuery = useQuery({ queryKey: ["affectations"], queryFn: () => getAffectations(client) });
  const creneauxQuery = useCreneaux(client, matiereClasseId ? { matiereClasseId } : undefined);
  const createCreneau = useCreateCreneau(client);
  const deleteCreneau = useDeleteCreneau(client);

  const profsDisponibles = (affectationsQuery.data ?? []).filter((a: any) => a.matiere_classe_id === matiereClasseId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matiereClasseId || !professeurId) return;
    createCreneau.mutate(
      {
        matiere_classe_id: matiereClasseId,
        professeur_id: professeurId,
        jour_semaine: Number(jourSemaine),
        heure_debut: heureDebut,
        heure_fin: heureFin,
        salle: salle || null,
      },
      { onSuccess: () => setSalle("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Emploi du temps" description="Consulter les emplois du temps par classe." />

      <Card className="mb-6 p-4">
        <Field label="Matière / Classe">
          <Select
            value={matiereClasseId}
            onChange={(e) => {
              setMatiereClasseId(e.target.value);
              setProfesseurId("");
            }}
          >
            <option value="">—</option>
            {mcQuery.data?.map((mc: any) => (
              <option key={mc.id} value={mc.id}>{mc.matieres?.nom} — {libelleClasse(mc.classes)}</option>
            ))}
          </Select>
        </Field>
      </Card>

      {matiereClasseId && (
        <>
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <Field label="Professeur">
                  <Select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required>
                    <option value="">—</option>
                    {profsDisponibles.map((a: any) => (
                      <option key={a.professeur_id} value={a.professeur_id}>{a.profiles?.prenom} {a.profiles?.nom}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Jour">
                  <Select value={jourSemaine} onChange={(e) => setJourSemaine(e.target.value)}>
                    {JOURS.map((j, i) => (
                      <option key={j} value={i + 1}>{j}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Début">
                  <Input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
                </Field>
              </div>
              <div>
                <Field label="Fin">
                  <Input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
                </Field>
              </div>
              <div className="w-24">
                <Field label="Salle">
                  <Input value={salle} onChange={(e) => setSalle(e.target.value)} placeholder="B12" />
                </Field>
              </div>
              <Button type="submit" disabled={createCreneau.isPending || !professeurId}>Ajouter</Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Jour</th>
                  <th className="px-4 py-2">Horaire</th>
                  <th className="px-4 py-2">Professeur</th>
                  <th className="px-4 py-2">Salle</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creneauxQuery.data?.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                    <td className="px-4 py-2 text-slate-500">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                    <td className="px-4 py-2 text-slate-500">{c.professeur?.prenom} {c.professeur?.nom}</td>
                    <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="danger" onClick={() => deleteCreneau.mutate(c.id)}>Supprimer</Button>
                    </td>
                  </tr>
                ))}
                {creneauxQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="Aucun créneau pour cette matière/classe." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

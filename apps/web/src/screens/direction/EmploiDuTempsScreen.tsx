import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { libelleClasse, useAuth, getClasses, getMatiereClasses, getAffectations, useCreneaux, useCreateCreneau, useDeleteCreneau, useUpdateCreneau } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client } = useAuth();
  const [classeId, setClasseId] = useState("");
  const [editionId, setEditionId] = useState<string | null>(null);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [professeurId, setProfesseurId] = useState("");
  const [jourSemaine, setJourSemaine] = useState("1");
  const [heureDebut, setHeureDebut] = useState("08:00");
  const [heureFin, setHeureFin] = useState("09:00");
  const [salle, setSalle] = useState("");

  const classes = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const mcQuery = useQuery({ queryKey: ["matiere-classes", classeId], queryFn: () => getMatiereClasses(client, classeId), enabled: Boolean(classeId) });
  const affectationsQuery = useQuery({ queryKey: ["affectations"], queryFn: () => getAffectations(client) });
  const creneauxQuery = useCreneaux(client, classeId ? { classeId } : undefined);
  const createCreneau = useCreateCreneau(client);
  const updateCreneau = useUpdateCreneau(client);
  const deleteCreneau = useDeleteCreneau(client);

  const profsDisponibles = (affectationsQuery.data ?? []).filter((a) => a.matiere_classe_id === matiereClasseId);

  const mutationEnCours = createCreneau.isPending || updateCreneau.isPending || deleteCreneau.isPending;
  const erreur = createCreneau.error ?? updateCreneau.error ?? deleteCreneau.error;
  const horairesValides = Boolean(heureDebut && heureFin && heureDebut < heureFin);

  function annulerEdition() {
    setEditionId(null);
    setMatiereClasseId("");
    setProfesseurId("");
    setJourSemaine("1");
    setHeureDebut("08:00");
    setHeureFin("09:00");
    setSalle("");
    createCreneau.reset();
    updateCreneau.reset();
    deleteCreneau.reset();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mutationEnCours || !horairesValides || !matiereClasseId || !profsDisponibles.some((a) => a.professeur_id === professeurId)) return;
    const creneau = {
      matiere_classe_id: matiereClasseId,
      professeur_id: professeurId,
      jour_semaine: Number(jourSemaine),
      heure_debut: heureDebut,
      heure_fin: heureFin,
      salle: salle.trim() || null,
    };
    createCreneau.reset();
    updateCreneau.reset();
    deleteCreneau.reset();
    if (editionId) updateCreneau.mutate({ id: editionId, creneau }, { onSuccess: annulerEdition });
    else createCreneau.mutate(creneau, { onSuccess: () => setSalle("") });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Emploi du temps" description="Ajouter, déplacer ou retirer les cours d’une classe." />

      <Card className="mb-6 p-4">
        <Field label="Classe">
          <Select aria-label="Classe" value={classeId} disabled={mutationEnCours} onChange={(event) => {
            setClasseId(event.target.value);
            annulerEdition();
          }}>
            <option value="">Choisir une classe</option>
            {classes.data?.map((classe) => (
              <option key={classe.id} value={classe.id}>{libelleClasse(classe)}</option>
            ))}
          </Select>
        </Field>
      </Card>

      {classeId && (
        <>
          <Card className="mb-8 p-4">
            <h2 className="mb-3 text-lg font-semibold">{editionId ? "Modifier le cours" : "Ajouter un cours"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <Field label="Matière">
                <Select aria-label="Matière" value={matiereClasseId} required onChange={(event) => {
                  setMatiereClasseId(event.target.value);
                  setProfesseurId("");
                }}>
                  <option value="">Choisir une matière</option>
                  {mcQuery.data?.map((mc) => <option key={mc.id} value={mc.id}>{mc.matieres?.nom}</option>)}
                </Select>
              </Field>
              <div>
                <Field label="Professeur">
                  <Select aria-label="Professeur" value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required>
                    <option value="">—</option>
                    {profsDisponibles.map((a: any) => (
                      <option key={a.professeur_id} value={a.professeur_id}>{a.profiles?.prenom} {a.profiles?.nom}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Jour">
                  <Select aria-label="Jour" value={jourSemaine} onChange={(e) => setJourSemaine(e.target.value)}>
                    {JOURS.map((j, i) => (
                      <option key={j} value={i + 1}>{j}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Début">
                  <Input aria-label="Début" type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
                </Field>
              </div>
              <div>
                <Field label="Fin">
                  <Input aria-label="Fin" type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
                </Field>
              </div>
              <div className="w-24">
                <Field label="Salle">
                  <Input aria-label="Salle" value={salle} onChange={(e) => setSalle(e.target.value)} placeholder="B12" />
                </Field>
              </div>
              <Button type="submit" disabled={mutationEnCours || !professeurId || !horairesValides}>
                {editionId ? "Enregistrer les modifications" : "Ajouter"}
              </Button>
              {editionId && <Button type="button" variant="secondary" disabled={mutationEnCours} onClick={annulerEdition}>Annuler</Button>}
            </form>
            {!horairesValides && <p className="mt-2 text-sm text-red-700">L’heure de fin doit suivre l’heure de début.</p>}
            {erreur && <p role="alert" className="mt-2 text-sm text-red-700">{erreur.message}</p>}
            {createCreneau.isSuccess && <p role="status" className="mt-2 text-sm text-teal-800">Cours ajouté.</p>}
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Jour</th>
                  <th className="px-4 py-2">Horaire</th>
                  <th className="px-4 py-2">Matière</th>
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
                    <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.matieres?.nom}</td>
                    <td className="px-4 py-2 text-slate-500">{c.professeur?.prenom} {c.professeur?.nom}</td>
                    <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" disabled={mutationEnCours} onClick={() => {
                        setEditionId(c.id);
                        setMatiereClasseId(c.matiere_classe_id);
                        setProfesseurId(c.professeur_id);
                        setJourSemaine(String(c.jour_semaine));
                        setHeureDebut(c.heure_debut.slice(0, 5));
                        setHeureFin(c.heure_fin.slice(0, 5));
                        setSalle(c.salle ?? "");
                      }}>Modifier</Button>
                      <Button variant="danger" className="ml-2" disabled={mutationEnCours} onClick={() => {
                        if (window.confirm("Supprimer ce cours de l’emploi du temps ?")) {
                          deleteCreneau.mutate(c.id, { onSuccess: () => { if (editionId === c.id) annulerEdition(); } });
                        }
                      }}>Supprimer</Button>
                    </td>
                  </tr>
                ))}
                {creneauxQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState message="Aucun créneau pour cette classe." />
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

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  useMesAffectations,
  getInscriptions,
  useVieScolaireClasse,
  useCreateEvenementVieScolaire,
  getJustificatifSignedUrl,
  libelleClasse,
} from "@ent/shared";
import { statutJustificatif, LIBELLES_JUSTIFICATIF } from "../../lib/statutJustificatif";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const affectationsQuery = useMesAffectations(client);
  const [matiereClasseId, setMatiereClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [type, setType] = useState<"absence" | "retard">("absence");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dureeMinutes, setDureeMinutes] = useState("15");

  const matiereClasseSelectionnee = affectationsQuery.data?.find((a: any) => a.matiere_classe_id === matiereClasseId);
  const classeId = matiereClasseSelectionnee?.matiere_classe?.classe_id ?? "";

  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeId],
    queryFn: () => getInscriptions(client, classeId),
    enabled: Boolean(classeId),
  });
  const vieScolaireQuery = useVieScolaireClasse(client, classeId || null);
  const creerEvenement = useCreateEvenementVieScolaire(client);

  async function handleVoirJustificatif(chemin: string) {
    const url = await getJustificatifSignedUrl(client, chemin);
    window.open(url, "_blank");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inscriptionsQuery.data?.some((inscription) => inscription.eleve_id === eleveId) || !classeId || !profile) return;
    const minutes = Number(dureeMinutes);
    if (type === "retard" && (!Number.isInteger(minutes) || minutes < 1)) return;
    creerEvenement.mutate(
      {
        eleve_id: eleveId,
        classe_id: classeId,
        type,
        date,
        duree_minutes: type === "retard" ? minutes : null,
        signale_par: profile.id,
      },
      { onSuccess: () => setEleveId("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Vie scolaire" description="Signaler absences, retards et sanctions." />

      <Card className="mb-6 p-4">
        <Field label="Matière / Classe">
          <Select aria-label="Matière / Classe" value={matiereClasseId} onChange={(e) => {
            setMatiereClasseId(e.target.value);
            setEleveId("");
          }}>
            <option value="">—</option>
            {affectationsQuery.data?.map((a: any) => (
              <option key={a.matiere_classe.id} value={a.matiere_classe.id}>
                {a.matiere_classe.matieres?.nom} — {libelleClasse(a.matiere_classe.classes)}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {classeId && (
        <>
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <Field label="Élève">
                  <Select aria-label="Élève" value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
                    <option value="">—</option>
                    {inscriptionsQuery.data?.map((i) => (
                      <option key={i.eleve_id} value={i.eleve_id}>{i.profiles?.prenom} {i.profiles?.nom}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Type">
                  <Select value={type} onChange={(e) => setType(e.target.value as "absence" | "retard")}>
                    <option value="absence">Absence</option>
                    <option value="retard">Retard</option>
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </Field>
              </div>
              {type === "retard" && (
                <div className="w-20">
                  <Field label="Minutes">
                    <Input type="number" min="1" required value={dureeMinutes} onChange={(e) => setDureeMinutes(e.target.value)} />
                  </Field>
                </div>
              )}
              <Button type="submit" disabled={creerEvenement.isPending || !eleveId}>Signaler</Button>
            </form>
          </Card>

          {creerEvenement.isError && <p role="alert" className="mb-4 text-sm text-red-700">Impossible d’enregistrer le signalement.</p>}
          <Card className="overflow-x-auto">
            {vieScolaireQuery.data?.length ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Élève</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Justifié</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vieScolaireQuery.data.map((v) => {
                    const statut = statutJustificatif(v);
                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-2 text-slate-900">{v.profiles?.prenom} {v.profiles?.nom}</td>
                        <td className="px-4 py-2 text-slate-500 capitalize">{v.type}{v.type === "retard" && v.duree_minutes ? ` (${v.duree_minutes} min)` : ""}</td>
                        <td className="px-4 py-2 text-slate-500">{formatDate(v.date)}</td>
                        <td className="px-4 py-2 text-slate-500">{statut ? LIBELLES_JUSTIFICATIF[statut] : "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {v.justificatif_chemin && (
                            <Button variant="ghost" onClick={() => handleVoirJustificatif(v.justificatif_chemin!)}>
                              Justificatif
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState message="Aucun événement pour cette classe." />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

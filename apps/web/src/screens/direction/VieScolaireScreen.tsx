import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getInscriptions,
  useVieScolaireClasse,
  useCreateEvenementVieScolaire,
  useJustifierEvenement,
  getJustificatifSignedUrl,
  libelleClasse,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client, profile } = useAuth();
  const [classeId, setClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const inscriptionsQuery = useQuery({
    queryKey: ["inscriptions", classeId],
    queryFn: () => getInscriptions(client, classeId),
    enabled: Boolean(classeId),
  });
  const vieScolaireQuery = useVieScolaireClasse(client, classeId || null);
  const creerSanction = useCreateEvenementVieScolaire(client);
  const justifier = useJustifierEvenement(client);

  async function handleVoirJustificatif(chemin: string) {
    const url = await getJustificatifSignedUrl(client, chemin);
    window.open(url, "_blank");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eleveId || !classeId || !profile || !description.trim()) return;
    creerSanction.mutate(
      { eleve_id: eleveId, classe_id: classeId, type: "sanction", date, description, signale_par: profile.id },
      { onSuccess: () => setDescription("") },
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Vie scolaire" description="Absences, retards et sanctions." />

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
        <>
          <Card className="mb-8 p-4">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <Field label="Élève">
                  <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
                    <option value="">—</option>
                    {inscriptionsQuery.data?.map((i: any) => (
                      <option key={i.eleve_id} value={i.eleve_id}>{i.profiles?.prenom} {i.profiles?.nom}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Sanction">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Avertissement, exclusion 1 jour…" required />
                </Field>
              </div>
              <Button type="submit" disabled={creerSanction.isPending || !eleveId}>Enregistrer</Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            {vieScolaireQuery.data?.length ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Élève</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Détail</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Justifié</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vieScolaireQuery.data.map((v: any) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2 text-slate-900">{v.profiles?.prenom} {v.profiles?.nom}</td>
                      <td className="px-4 py-2 text-slate-500 capitalize">{v.type}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {v.type === "sanction" ? v.description : v.type === "retard" && v.duree_minutes ? `${v.duree_minutes} min` : v.motif ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{formatDate(v.date)}</td>
                      <td className="px-4 py-2 text-slate-500">{v.justifie ? "Oui" : "Non"}</td>
                      <td className="px-4 py-2 text-right">
                        {v.justificatif_chemin && (
                          <Button variant="ghost" className="mr-3" onClick={() => handleVoirJustificatif(v.justificatif_chemin)}>
                            Justificatif
                          </Button>
                        )}
                        {v.type !== "sanction" && !v.justifie && (
                          <Button
                            variant="ghost"
                            className="hover:text-emerald-600"
                            onClick={() => justifier.mutate({ id: v.id, justifie: true, motif: "Justifié par la direction" })}
                          >
                            Justifier
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
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

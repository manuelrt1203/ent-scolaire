import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  getClasses,
  getUtilisateurs,
  useInvitations,
  useCreateInvitation,
  useDeleteInvitation,
  type Role,
  libelleClasse,
} from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Select } from "../../components/ui/Field";

const ROLES: { value: Role; label: string }[] = [
  { value: "professeur", label: "Professeur" },
  { value: "eleve", label: "Élève" },
  { value: "parent", label: "Parent" },
  { value: "direction", label: "Direction" },
];

export function InvitationsScreen() {
  const { client, profile } = useAuth();
  const [role, setRole] = useState<Role>("eleve");
  const [classeId, setClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [dernierCode, setDernierCode] = useState<string | null>(null);
  const [copieId, setCopieId] = useState<string | null>(null);

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => getClasses(client) });
  const elevesQuery = useQuery({ queryKey: ["utilisateurs", "eleve"], queryFn: () => getUtilisateurs(client, "eleve") });
  const invitationsQuery = useInvitations(client);
  const createMutation = useCreateInvitation(client);
  const deleteMutation = useDeleteInvitation(client);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (role === "parent" && !eleveId) return;
    createMutation.mutate(
      {
        etablissementId: profile!.etablissement_id,
        role,
        classeId: role === "eleve" ? classeId || undefined : undefined,
        eleveId: role === "parent" ? eleveId : undefined,
        createdBy: profile!.id,
      },
      {
        onSuccess: (invitation) => {
          setDernierCode(invitation.code);
          setClasseId("");
          setEleveId("");
        },
      },
    );
  }

  async function copierCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopieId(id);
    setTimeout(() => setCopieId(null), 1500);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Invitations"
        description="Générez un code que les professeurs/élèves/parents saisissent eux-mêmes dans l'app pour créer leur compte — le rôle (et pour un parent, l'enfant) est verrouillé par le code, jamais choisi par la personne."
      />

      <Card className="mb-4 p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <Field label="Rôle">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          {role === "eleve" && (
            <div>
              <Field label="Classe (optionnel)">
                <Select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                  <option value="">Aucune (à affecter plus tard)</option>
                  {classesQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{libelleClasse(c)}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          {role === "parent" && (
            <div>
              <Field label="Élève">
                <Select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
                  <option value="">—</option>
                  {elevesQuery.data?.map((el) => (
                    <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <Button type="submit" disabled={createMutation.isPending || (role === "parent" && !eleveId)}>
            Générer le code
          </Button>
        </form>
      </Card>

      {dernierCode && (
        <p className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Code généré : <span className="font-mono font-semibold">{dernierCode}</span> — partagez-le aux personnes
          concernées, elles le saisissent via "J'ai un code d'invitation" sur l'écran de connexion.
        </p>
      )}

      <Card className="overflow-x-auto">
        {invitationsQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Rôle</th>
                <th className="px-4 py-2">Rattachement</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invitationsQuery.data.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 font-mono text-slate-900">{inv.code}</td>
                  <td className="px-4 py-2 text-slate-500">{ROLES.find((r) => r.value === inv.role)?.label}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {libelleClasse(inv.classes) || (inv.eleve ? `${inv.eleve.prenom} ${inv.eleve.nom}` : "—")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => copierCode(inv.id, inv.code)}>
                      {copieId === inv.id ? "Copié !" : "Copier"}
                    </Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(inv.id)}>Révoquer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune invitation générée." />
        )}
      </Card>
    </div>
  );
}

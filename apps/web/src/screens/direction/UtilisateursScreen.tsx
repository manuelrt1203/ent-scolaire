import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, inviteUser, updateProfile, type Role } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";

const ROLES: { value: Role; label: string }[] = [
  { value: "direction", label: "Direction" },
  { value: "professeur", label: "Professeur" },
  { value: "eleve", label: "Élève" },
  { value: "parent", label: "Parent" },
];

export function UtilisateursScreen() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("professeur");
  const [lastCreated, setLastCreated] = useState<{ prenom: string; nom: string; email: string } | null>(null);

  const usersQuery = useQuery({ queryKey: ["utilisateurs"], queryFn: () => getUtilisateurs(client) });

  const createMutation = useMutation({
    mutationFn: () => inviteUser(client, { email, role, nom, prenom }),
    onSuccess: () => {
      setLastCreated({ prenom, nom, email });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateProfile(client, editingId as string, { nom, prenom }),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) => updateProfile(client, id, { actif }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["utilisateurs"] }),
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setPrenom("");
    setEmail("");
    setRole("professeur");
  }

  function handleEdit(u: { id: string; nom: string; prenom: string; email: string; role: Role }) {
    setEditingId(u.id);
    setNom(u.nom);
    setPrenom(u.prenom);
    setEmail(u.email);
    setRole(u.role);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Utilisateurs" description="Gérer les comptes professeurs, élèves et parents." />

      <Card className="mb-4 p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <Field label="Prénom">
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </Field>
          </div>
          <div>
            <Field label="Nom">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required />
            </Field>
          </div>
          <div>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={Boolean(editingId)} />
            </Field>
          </div>
          <div>
            <Field label="Rôle">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={Boolean(editingId)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={isPending}>{editingId ? "Enregistrer" : "Créer le compte"}</Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
          )}
        </form>
      </Card>
      {editingId && (
        <p className="mb-4 text-xs text-slate-400">
          Modification limitée au prénom/nom — l'email et le rôle ne peuvent pas être changés depuis cet écran.
        </p>
      )}

      {createMutation.isError && (
        <p className="mb-4 text-sm text-red-600">{(createMutation.error as Error).message}</p>
      )}
      {lastCreated && (
        <p className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800">
          Compte créé pour {lastCreated.prenom} {lastCreated.nom}. Cette personne peut l'activer elle-même via
          « Première connexion » avec l'email {lastCreated.email} (un code lui sera envoyé par email).
        </p>
      )}

      <Card className="overflow-x-auto">
        {usersQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rôle</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersQuery.data.map((u) => (
                <tr key={u.id} className={u.actif ? "" : "opacity-50"}>
                  <td className="px-4 py-2 text-slate-900">{u.prenom} {u.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2 text-slate-500">{ROLES.find((r) => r.value === u.role)?.label}</td>
                  <td className="px-4 py-2 text-slate-500">{u.actif ? "Actif" : "Désactivé"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="mr-3" onClick={() => handleEdit(u)}>Modifier</Button>
                    <Button variant="danger" onClick={() => toggleActifMutation.mutate({ id: u.id, actif: !u.actif })}>
                      {u.actif ? "Désactiver" : "Réactiver"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun utilisateur créé pour le moment." />
        )}
      </Card>
    </div>
  );
}

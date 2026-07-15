import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, inviteUser, type Role } from "@ent/shared";

const ROLES: { value: Role; label: string }[] = [
  { value: "direction", label: "Direction" },
  { value: "professeur", label: "Professeur" },
  { value: "eleve", label: "Élève" },
  { value: "parent", label: "Parent" },
];

export function UtilisateursScreen() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
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
      setNom("");
      setPrenom("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Utilisateurs</h1>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Prénom</label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Créer le compte
        </button>
      </form>

      {createMutation.isError && (
        <p className="mb-4 text-sm text-red-600">{(createMutation.error as Error).message}</p>
      )}
      {lastCreated && (
        <p className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800">
          Compte créé pour {lastCreated.prenom} {lastCreated.nom}. Cette personne peut l'activer elle-même via
          « Première connexion » avec l'email {lastCreated.email} (un code lui sera envoyé par email).
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersQuery.data?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 text-slate-900">{u.prenom} {u.nom}</td>
                <td className="px-4 py-2 text-slate-500">{u.email}</td>
                <td className="px-4 py-2 text-slate-500">{ROLES.find((r) => r.value === u.role)?.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

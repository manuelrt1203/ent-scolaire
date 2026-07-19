import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, inviteUser, updateProfile, type Role } from "@ent/shared";

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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={Boolean(editingId)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={Boolean(editingId)} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isPending} className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {editingId ? "Enregistrer" : "Créer le compte"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="px-2 py-2 text-xs text-slate-500 hover:underline">
            Annuler
          </button>
        )}
      </form>
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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            {usersQuery.data?.map((u) => (
              <tr key={u.id} className={u.actif ? "" : "opacity-50"}>
                <td className="px-4 py-2 text-slate-900">{u.prenom} {u.nom}</td>
                <td className="px-4 py-2 text-slate-500">{u.email}</td>
                <td className="px-4 py-2 text-slate-500">{ROLES.find((r) => r.value === u.role)?.label}</td>
                <td className="px-4 py-2 text-slate-500">{u.actif ? "Actif" : "Désactivé"}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(u)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleActifMutation.mutate({ id: u.id, actif: !u.actif })}
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    {u.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

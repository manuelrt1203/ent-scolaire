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
} from "@ent/shared";

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
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Invitations</h1>
      <p className="mb-6 text-xs text-slate-500">
        Générez un code que les professeurs/élèves/parents saisissent eux-mêmes dans l'app pour créer leur compte —
        le rôle (et pour un parent, l'enfant) est verrouillé par le code, jamais choisi par la personne.
      </p>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {role === "eleve" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Classe (optionnel)</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Aucune (à affecter plus tard)</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        )}
        {role === "parent" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Élève</label>
            <select value={eleveId} onChange={(e) => setEleveId(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {elevesQuery.data?.map((el) => (
                <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending || (role === "parent" && !eleveId)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Générer le code
        </button>
      </form>

      {dernierCode && (
        <p className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Code généré : <span className="font-mono font-semibold">{dernierCode}</span> — partagez-le aux personnes
          concernées, elles le saisissent via "J'ai un code d'invitation" sur l'écran de connexion.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            {invitationsQuery.data?.map((inv: any) => (
              <tr key={inv.id}>
                <td className="px-4 py-2 font-mono text-slate-900">{inv.code}</td>
                <td className="px-4 py-2 text-slate-500">{ROLES.find((r) => r.value === inv.role)?.label}</td>
                <td className="px-4 py-2 text-slate-500">
                  {inv.classes?.nom ?? (inv.eleve ? `${inv.eleve.prenom} ${inv.eleve.nom}` : "—")}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => copierCode(inv.id, inv.code)} className="mr-3 text-xs text-slate-400 hover:text-slate-900">
                    {copieId === inv.id ? "Copié !" : "Copier"}
                  </button>
                  <button onClick={() => deleteMutation.mutate(inv.id)} className="text-xs text-slate-400 hover:text-red-600">
                    Révoquer
                  </button>
                </td>
              </tr>
            ))}
            {invitationsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucune invitation générée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

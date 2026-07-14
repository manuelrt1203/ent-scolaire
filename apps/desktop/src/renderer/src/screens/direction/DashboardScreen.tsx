import { useAuth } from "@ent/shared";

export function DashboardScreen() {
  const { profile } = useAuth();
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Bonjour {profile?.prenom}</h1>
      <p className="text-sm text-slate-500">
        Utilisez le menu pour gérer les classes, matières, affectations et pour suivre les relevés de notes à
        valider.
      </p>
    </div>
  );
}

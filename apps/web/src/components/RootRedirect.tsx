import { Navigate } from "react-router-dom";
import { useAuth } from "@ent/shared";
import { LandingScreen } from "../screens/LandingScreen";

export function RootRedirect() {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Chargement…</div>;
  if (!session) return <LandingScreen />;
  if (!profile) return <div className="flex h-screen items-center justify-center text-slate-500">Chargement du profil…</div>;

  if (profile.role === "direction") return <Navigate to="/direction" replace />;
  if (profile.role === "professeur") return <Navigate to="/professeur" replace />;
  if (profile.role === "eleve") return <Navigate to="/eleve" replace />;
  if (profile.role === "parent") return <Navigate to="/parent" replace />;

  return (
    <div className="flex h-screen items-center justify-center text-slate-500">
      Ce rôle n'est pas encore pris en charge.
    </div>
  );
}

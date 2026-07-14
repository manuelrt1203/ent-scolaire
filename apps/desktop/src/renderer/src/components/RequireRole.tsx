import { Navigate } from "react-router-dom";
import { useAuth, type Enums } from "@ent/shared";
import type { ReactNode } from "react";

export function RequireRole({ role, children }: { role: Enums<"role_utilisateur">; children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="flex h-screen items-center justify-center text-slate-500">Chargement du profil…</div>;
  if (profile.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

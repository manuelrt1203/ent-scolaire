import { NavLink, Outlet } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import type { ReactNode } from "react";

function NavItem({ to, children, badge }: { to: string; children: ReactNode; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
          isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      <span>{children}</span>
      {Boolean(badge) && (
        <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">{badge}</span>
      )}
    </NavLink>
  );
}

export function Layout({ nav }: { nav: { to: string; label: string }[] }) {
  const { client, profile, signOut } = useAuth();
  const nonLusQuery = useNombreNonLus(client);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-900">ENT Scolaire</p>
          <p className="text-xs text-slate-500">
            {profile?.prenom} {profile?.nom}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavItem key={item.to} to={item.to} badge={item.to.endsWith("/messagerie") ? nonLusQuery.data : undefined}>
              {item.label}
            </NavItem>
          ))}
        </nav>
        <button onClick={() => signOut()} className="mt-4 rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100">
          Se déconnecter
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

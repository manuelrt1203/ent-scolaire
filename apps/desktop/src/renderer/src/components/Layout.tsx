import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@ent/shared";
import type { ReactNode } from "react";

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium ${
          isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout({ nav }: { nav: { to: string; label: string }[] }) {
  const { profile, signOut } = useAuth();

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
            <NavItem key={item.to} to={item.to}>
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

import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

function Tab({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `border-b-2 px-1 pb-2 text-sm font-medium ${
          isActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

// Chemins relatifs passés explicitement par l'écran appelant : la profondeur
// de "../" nécessaire diffère selon qu'on est monté sur "messagerie" (Inbox)
// ou "messagerie/envoyes" (Sent), donc pas de chemin unique codé en dur ici.
export function MessagerieTabs({ receptionHref, envoyesHref }: { receptionHref: string; envoyesHref: string }) {
  return (
    <div className="mb-6 flex gap-6 border-b border-slate-200">
      <Tab to={receptionHref}>Boîte de réception</Tab>
      <Tab to={envoyesHref}>Envoyés</Tab>
    </div>
  );
}

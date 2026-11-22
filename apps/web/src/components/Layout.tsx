import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { CATEGORIES, CATEGORY_META, type NavItem } from "../nav";
import { IconLogOut, IconHome, IconBookOpen, IconClipboard, IconMail } from "./icons";
import { EntBrand } from "./EntBrand";
import { NotificationBell } from "./NotificationBell";
import { RechercheGlobale } from "./RechercheGlobale";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function Layout({ nav, homePath }: { nav: NavItem[]; homePath: string }) {
  const { client, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nonLusQuery = useNombreNonLus(client);

  const espaceParent = profile?.role === "parent";
  const [rubriquesOuvertes, setRubriquesOuvertes] = useState(false);
  const accesParent = [
    { to: homePath, label: "Accueil", Icon: IconHome },
    { to: `${homePath}/notes`, label: "Notes", Icon: IconBookOpen },
    { to: `${homePath}/emploi-du-temps`, label: "Horaires", Icon: IconClipboard },
    { to: `${homePath}/messagerie`, label: "Messages", Icon: IconMail },
  ];
  const categoriesPresentes = Array.from(new Set(nav.map((item) => item.category)));

  const estSurAccueil = location.pathname === homePath;
  const categorieActive = estSurAccueil
    ? (searchParams.get("categorie") ?? "tous")
    : (location.pathname.startsWith(`${homePath}/matiere/`) ? "scolarite" : nav.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.category ?? "tous");

  function allerVersCategorie(categorie: string) {
    setRubriquesOuvertes(false);
    navigate(categorie === "tous" ? homePath : `${homePath}?categorie=${categorie}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-3 accueil-banniere border-b border-white/10 px-4 py-3 sm:px-6">
        <EntBrand homePath={homePath} />
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <RechercheGlobale homePath={homePath} />
          <NotificationBell />
          {profile?.role && (
            <span className="hidden shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-xs font-medium text-slate-300 sm:inline">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          )}
          <span className="hidden truncate text-sm text-slate-300 sm:inline">
            {profile?.prenom} {profile?.nom}
          </span>
          <button
            aria-label="Déconnexion"
            onClick={() => signOut()}
            className="flex shrink-0 items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <IconLogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {espaceParent && (
        <nav aria-label="Raccourcis famille" className="grid grid-cols-4 border-b border-slate-200 bg-white px-2 lg:hidden">
          {accesParent.map(({ to, label, Icon }) => {
            const actif = location.pathname === to || (to !== homePath && location.pathname.startsWith(`${to}/`))
              || (label === "Notes" && location.pathname.startsWith(`${homePath}/matiere/`));
            return (
              <Link key={to} to={to} aria-current={actif ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium ${actif ? "text-teal-800" : "text-slate-600"}`}>
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
      {espaceParent && (
        <button type="button" aria-controls="menu-rubriques" aria-expanded={rubriquesOuvertes}
          onClick={() => setRubriquesOuvertes((ouvert) => !ouvert)}
          className="border-b border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-teal-800 lg:hidden">
          {rubriquesOuvertes ? "Masquer les rubriques" : "Toutes les rubriques"}
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <nav id="menu-rubriques" aria-label="Rubriques" className={`border-b border-slate-200 bg-white px-4 lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-3 lg:py-5 ${espaceParent && !rubriquesOuvertes ? "hidden lg:block" : ""}`}>
          <div className={`flex gap-3 overflow-x-auto lg:flex-col lg:gap-1 ${espaceParent ? "flex-wrap gap-x-4 gap-y-0" : ""}`}>
            <button
              onClick={() => allerVersCategorie("tous")}
              aria-current={categorieActive === "tous" ? "page" : undefined}
              className={`shrink-0 border-b-2 px-1 py-3 text-left text-sm font-medium transition-colors lg:rounded-lg lg:border-b-0 lg:px-3 ${
                categorieActive === "tous"
                  ? "border-teal-700 text-teal-800 lg:bg-teal-50"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Tous les espaces
            </button>
            {categoriesPresentes.map((categorie) => {
              const meta = CATEGORY_META[categorie];
              const Icon = meta?.icon;
              const active = categorieActive === categorie;
              return (
                <button
                  key={categorie}
                  onClick={() => allerVersCategorie(categorie)}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-left text-sm font-medium transition-colors lg:rounded-lg lg:border-b-0 lg:px-3 ${
                    active ? "border-teal-700 text-teal-800 lg:bg-teal-50" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {CATEGORIES[categorie]}
                  {categorie === "communication" && Boolean(nonLusQuery.data) && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                      {nonLusQuery.data}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7 lg:p-8">
          <div className="mx-auto max-w-6xl"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

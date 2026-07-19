import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { CATEGORIES, type NavItem } from "../nav";

export function Layout({ nav, homePath }: { nav: NavItem[]; homePath: string }) {
  const { client, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nonLusQuery = useNombreNonLus(client);

  const categoriesPresentes = Array.from(new Set(nav.map((item) => item.category)));

  const estSurAccueil = location.pathname === homePath;
  const categorieActive = estSurAccueil
    ? (searchParams.get("categorie") ?? "tous")
    : (nav.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.category ?? "tous");

  function allerVersCategorie(categorie: string) {
    navigate(categorie === "tous" ? homePath : `${homePath}?categorie=${categorie}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 sm:px-6">
        <button onClick={() => navigate(homePath)} className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-900">E</div>
          <span className="hidden text-sm font-semibold text-white sm:inline">ENT Scolaire</span>
        </button>
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="hidden truncate text-sm text-slate-300 sm:inline">
            {profile?.prenom} {profile?.nom}
          </span>
          <button onClick={() => signOut()} className="shrink-0 text-sm text-slate-400 hover:text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex gap-4 overflow-x-auto sm:gap-6">
          <button
            onClick={() => allerVersCategorie("tous")}
            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
              categorieActive === "tous"
                ? "border-indigo-ink text-midnight-ink"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Tous
          </button>
          {categoriesPresentes.map((categorie) => (
            <button
              key={categorie}
              onClick={() => allerVersCategorie(categorie)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
                categorieActive === categorie
                  ? "border-indigo-ink text-midnight-ink"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {CATEGORIES[categorie]}
              {categorie === "communication" && Boolean(nonLusQuery.data) && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold normal-case text-white">
                  {nonLusQuery.data}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}

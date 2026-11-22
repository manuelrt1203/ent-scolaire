import { Link, useSearchParams } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { CATEGORIES, CATEGORY_META, type NavItem } from "../nav";
import { PrioritesDirection, PrioritesParent } from "../components/AccueilPriorites";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { IconArrowRight, IconGraduationCap } from "../components/icons";

export function AccueilScreen({ nav }: { nav: NavItem[] }) {
  const { client, profile } = useAuth();
  const nonLusQuery = useNombreNonLus(client);
  const [searchParams] = useSearchParams();
  const categorie = searchParams.get("categorie");

  const direction = profile?.role === "direction";
  const parent = profile?.role === "parent";
  const tableauDeBord = (direction || parent) && !categorie;
  const items = categorie ? nav.filter((item) => item.category === categorie) : nav;

  return (
    <div>
      {tableauDeBord ? (
        <>
          <div className="accueil-banniere mb-5 flex items-start justify-between gap-4 overflow-hidden rounded-2xl px-6 py-7 text-white sm:px-8 sm:py-8">
            <div>
              <p className="mb-2 text-sm font-medium text-teal-200">{direction ? "Espace direction" : "Espace famille"}</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">Bonjour {profile?.prenom}</h1>
            </div>
            <span className="hidden size-16 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-teal-100 sm:grid">
              <IconGraduationCap className="size-9" aria-hidden />
            </span>
          </div>
          {direction ? <PrioritesDirection /> : <PrioritesParent />}
          <h2 className="mb-3 mt-8 text-lg font-semibold text-midnight-ink">Tous les espaces</h2>
        </>
      ) : (
        <>
          {parent && <ChildSwitcher />}
          <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Bonjour {profile?.prenom}</h1>
          <p className="mb-6 text-sm text-slate-500">{categorie ? CATEGORIES[categorie] : "Tous les espaces accessibles"}</p>
        </>
      )}
      <div className={tableauDeBord ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {items.map((item) => {
          const meta = CATEGORY_META[item.category];
          const Icon = meta?.icon;
          const misEnAvant = item.featured && !tableauDeBord;
          const badge = item.to.endsWith("/messagerie") && Boolean(nonLusQuery.data);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group rounded-lg border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                misEnAvant ? "border-ent-accent/25 bg-ent-tint lg:col-span-2" : "border-slate-200 bg-white hover:border-ent-accent/40"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                {Icon && (
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${meta.badge}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                {badge && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {nonLusQuery.data}
                  </span>
                )}
              </div>
              <span className={`block text-sm font-semibold ${misEnAvant ? "text-midnight-ink" : "text-slate-900"}`}>
                {item.label}
              </span>
              <p className={`mt-1 text-sm ${misEnAvant ? "text-midnight-ink" : "text-slate-500"}`}>{item.description}</p>
              <span
                className={`mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 ${
                  misEnAvant ? "text-ent-accent" : "text-slate-400"
                }`}
              >
                Ouvrir <IconArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

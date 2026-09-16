import { Link, useSearchParams } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { CATEGORIES, CATEGORY_META, type NavItem } from "../nav";
import { IconArrowRight } from "../components/icons";

export function AccueilScreen({ nav }: { nav: NavItem[] }) {
  const { client, profile } = useAuth();
  const nonLusQuery = useNombreNonLus(client);
  const [searchParams] = useSearchParams();
  const categorie = searchParams.get("categorie");

  const items = categorie ? nav.filter((item) => item.category === categorie) : nav;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Bonjour {profile?.prenom}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {categorie ? CATEGORIES[categorie] : "Tous les espaces accessibles"}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const meta = CATEGORY_META[item.category];
          const Icon = meta?.icon;
          const badge = item.to.endsWith("/messagerie") && Boolean(nonLusQuery.data);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group rounded-lg border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                item.featured ? "border-indigo-ink/25 bg-periwinkle-wash lg:col-span-2" : "border-slate-200 bg-white hover:border-indigo-ink/40"
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
              <span className={`block text-sm font-semibold ${item.featured ? "text-midnight-ink" : "text-slate-900"}`}>
                {item.label}
              </span>
              <p className={`mt-1 text-sm ${item.featured ? "text-deep-violet" : "text-slate-500"}`}>{item.description}</p>
              <span
                className={`mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                  item.featured ? "text-indigo-ink" : "text-slate-400"
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

import { Link, useSearchParams } from "react-router-dom";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { CATEGORIES, type NavItem } from "../nav";

export function AccueilScreen({ nav }: { nav: NavItem[] }) {
  const { client, profile } = useAuth();
  const nonLusQuery = useNombreNonLus(client);
  const [searchParams] = useSearchParams();
  const categorie = searchParams.get("categorie");

  const items = categorie ? nav.filter((item) => item.category === categorie) : nav;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Bonjour {profile?.prenom}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {categorie ? CATEGORIES[categorie] : "Tous les espaces accessibles"}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{item.label}</span>
              {item.to.endsWith("/messagerie") && Boolean(nonLusQuery.data) && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {nonLusQuery.data}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie, getActualites, getBoiteReception } from "@ent/shared";
import { IconSearch } from "./icons";

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const MAX_PAR_SECTION = 5;

export function RechercheGlobale({ homePath }: { homePath: string }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const annuaireQuery = useQuery({
    queryKey: ["annuaire-messagerie"],
    queryFn: () => getAnnuaireMessagerie(client),
    enabled: ouvert,
  });
  const actualitesQuery = useQuery({ queryKey: ["actualites"], queryFn: () => getActualites(client), enabled: ouvert });
  const inboxQuery = useQuery({ queryKey: ["messagerie", "inbox"], queryFn: () => getBoiteReception(client), enabled: ouvert });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    }
    if (ouvert) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ouvert]);

  const terme = normaliser(requete.trim());

  const personnes = useMemo(() => {
    if (!terme) return [];
    return (annuaireQuery.data ?? [])
      .filter((p: any) => normaliser(`${p.prenom} ${p.nom}`).includes(terme))
      .slice(0, MAX_PAR_SECTION);
  }, [annuaireQuery.data, terme]);

  const actualites = useMemo(() => {
    if (!terme) return [];
    return (actualitesQuery.data ?? [])
      .filter((a: any) => normaliser(a.titre).includes(terme) || normaliser(a.contenu ?? "").includes(terme))
      .slice(0, MAX_PAR_SECTION);
  }, [actualitesQuery.data, terme]);

  const messages = useMemo(() => {
    if (!terme) return [];
    return (inboxQuery.data ?? [])
      .filter((r: any) => normaliser(r.messages?.sujet ?? "").includes(terme) || normaliser(r.messages?.corps ?? "").includes(terme))
      .slice(0, MAX_PAR_SECTION);
  }, [inboxQuery.data, terme]);

  const aucunResultat = terme.length > 0 && personnes.length === 0 && actualites.length === 0 && messages.length === 0;

  function allerA(chemin: string) {
    setOuvert(false);
    setRequete("");
    navigate(chemin);
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5">
        <IconSearch className="h-4 w-4 text-slate-400" />
        <input
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onFocus={() => setOuvert(true)}
          placeholder="Rechercher…"
          className="w-36 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none lg:w-52"
        />
      </div>

      {ouvert && terme.length > 0 && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto py-2">
            {personnes.length > 0 && (
              <div className="mb-1">
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Personnes</p>
                {personnes.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => allerA(`${homePath}/annuaire`)}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-900">{p.prenom} {p.nom}</span>
                    <span className="text-xs text-slate-400">{p.email}</span>
                  </button>
                ))}
              </div>
            )}

            {actualites.length > 0 && (
              <div className="mb-1">
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Actualités</p>
                {actualites.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => allerA(`${homePath}/actualites`)}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-900 hover:bg-slate-50"
                  >
                    <span className="truncate">{a.titre}</span>
                  </button>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div>
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Messages</p>
                {messages.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => allerA(`${homePath}/messagerie/${r.messages.id}`)}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="truncate text-sm text-slate-900">{r.messages?.sujet}</span>
                    <span className="text-xs text-slate-400">
                      {r.messages?.expediteur?.prenom} {r.messages?.expediteur?.nom}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {aucunResultat && <p className="px-4 py-6 text-center text-sm text-slate-400">Aucun résultat.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

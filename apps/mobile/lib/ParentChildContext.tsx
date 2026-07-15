import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getMesEnfants } from "@ent/shared";

interface ParentChildContextValue {
  enfants: { id: string; nom: string; prenom: string }[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

const ParentChildContext = createContext<ParentChildContextValue | null>(null);

export function ParentChildProvider({ children }: { children: ReactNode }) {
  const { client } = useAuth();
  const enfantsQuery = useQuery({ queryKey: ["mes-enfants"], queryFn: () => getMesEnfants(client) });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enfants = (enfantsQuery.data ?? []).map((l: any) => l.eleve).filter(Boolean);

  useEffect(() => {
    if (!selectedId && enfants.length > 0) setSelectedId(enfants[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfants.length]);

  return (
    <ParentChildContext.Provider value={{ enfants, selectedId, setSelectedId }}>{children}</ParentChildContext.Provider>
  );
}

export function useParentChild(): ParentChildContextValue {
  const ctx = useContext(ParentChildContext);
  if (!ctx) throw new Error("useParentChild doit être utilisé à l'intérieur de <ParentChildProvider>");
  return ctx;
}

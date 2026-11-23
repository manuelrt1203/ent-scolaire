import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [selection, setSelection] = useState<string | null>(null);
  const [parametres, setParametres] = useSearchParams();

  const enfants = (enfantsQuery.data ?? []).flatMap(({ eleve }) => eleve ? [eleve] : []);

  const demande = parametres.get("enfant");
  const enfantDemande = enfants.find(({ id }) => id === demande);
  const selectedId = enfantDemande?.id ?? enfants.find(({ id }) => id === selection)?.id ?? enfants[0]?.id ?? null;

  useEffect(() => {
    if (enfantDemande) setSelection(enfantDemande.id);
  }, [enfantDemande]);

  function setSelectedId(id: string) {
    setSelection(id);
    if (demande) {
      const suivants = new URLSearchParams(parametres);
      suivants.delete("enfant");
      setParametres(suivants, { replace: true });
    }
  }

  return (
    <ParentChildContext.Provider value={{ enfants, selectedId, setSelectedId }}>{children}</ParentChildContext.Provider>
  );
}

export function useParentChild(): ParentChildContextValue {
  const ctx = useContext(ParentChildContext);
  if (!ctx) throw new Error("useParentChild doit être utilisé à l'intérieur de <ParentChildProvider>");
  return ctx;
}

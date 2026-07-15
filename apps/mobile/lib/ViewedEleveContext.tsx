import { createContext, useContext, type ReactNode } from "react";

// Permet aux écrans de consultation (notes) d'être identiques que
// l'utilisateur soit l'élève lui-même ou un parent consultant un enfant :
// (eleve)/_layout.tsx fournit toujours profile.id, (parent)/_layout.tsx
// fournit l'id de l'enfant actuellement sélectionné.
const ViewedEleveContext = createContext<string | null>(null);

export function ViewedEleveProvider({ eleveId, children }: { eleveId: string | null; children: ReactNode }) {
  return <ViewedEleveContext.Provider value={eleveId}>{children}</ViewedEleveContext.Provider>;
}

export function useViewedEleveId(): string | null {
  return useContext(ViewedEleveContext);
}

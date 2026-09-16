import { createContext, useContext, type ReactNode } from "react";

// Permet aux écrans de consultation (notes, cahier de textes...) d'être
// identiques que l'utilisateur soit l'élève lui-même ou un parent consultant
// un enfant : EleveLayout fournit toujours profile.id, ParentLayout fournit
// l'id de l'enfant actuellement sélectionné (ChildSwitcher). Même pattern que
// apps/mobile/lib/ViewedEleveContext.tsx.
const ViewedEleveContext = createContext<string | null>(null);

export function ViewedEleveProvider({ eleveId, children }: { eleveId: string | null; children: ReactNode }) {
  return <ViewedEleveContext.Provider value={eleveId}>{children}</ViewedEleveContext.Provider>;
}

export function useViewedEleveId(): string | null {
  return useContext(ViewedEleveContext);
}

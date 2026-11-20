import { useAuth } from "@ent/shared";
import { Layout } from "./Layout";
import { ViewedEleveProvider } from "../lib/ViewedEleveContext";
import { ParentChildProvider, useParentChild } from "../lib/ParentChildContext";
import { ELEVE_NAV, PARENT_NAV } from "../nav";

/** Élève : la donnée consultée est toujours la sienne. */
export function EleveLayout() {
  const { profile } = useAuth();
  return (
    <ViewedEleveProvider eleveId={profile?.id ?? null}>
      <Layout nav={ELEVE_NAV} homePath="/eleve" />
    </ViewedEleveProvider>
  );
}

/** Parent : la donnée consultée dépend de l'enfant sélectionné (ChildSwitcher,
 * affiché uniquement sur l'accueil et les notes — voir AccueilScreen et
 * screens/eleve/NotesScreen.tsx, même choix que l'app mobile). */
function ParentLayoutInner() {
  const { selectedId } = useParentChild();
  return (
    <ViewedEleveProvider eleveId={selectedId}>
      <Layout nav={PARENT_NAV} homePath="/parent" />
    </ViewedEleveProvider>
  );
}

export function ParentLayout() {
  return (
    <ParentChildProvider>
      <ParentLayoutInner />
    </ParentChildProvider>
  );
}

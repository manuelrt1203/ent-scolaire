import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireRole } from "./components/RequireRole";
import { RootRedirect } from "./components/RootRedirect";
import { Layout } from "./components/Layout";
import { EleveLayout, ParentLayout, AccueilAvecSwitcher } from "./components/EleveParentLayouts";
import { DIRECTION_NAV, PROFESSEUR_NAV, ELEVE_NAV, PARENT_NAV } from "./nav";

const LoginScreen = lazy(() => import("./screens/auth/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const ActivationScreen = lazy(() => import("./screens/auth/ActivationScreen").then((m) => ({ default: m.ActivationScreen })));
const InscriptionEtablissementScreen = lazy(() =>
  import("./screens/auth/InscriptionEtablissementScreen").then((m) => ({ default: m.InscriptionEtablissementScreen })),
);
const InvitationScreen = lazy(() => import("./screens/auth/InvitationScreen").then((m) => ({ default: m.InvitationScreen })));
const AccueilScreen = lazy(() => import("./screens/AccueilScreen").then((m) => ({ default: m.AccueilScreen })));
const ClassesScreen = lazy(() => import("./screens/direction/ClassesScreen").then((m) => ({ default: m.ClassesScreen })));
const MatieresScreen = lazy(() => import("./screens/direction/MatieresScreen").then((m) => ({ default: m.MatieresScreen })));
const MatiereClasseScreen = lazy(() =>
  import("./screens/direction/MatiereClasseScreen").then((m) => ({ default: m.MatiereClasseScreen })),
);
const PeriodesScreen = lazy(() => import("./screens/direction/PeriodesScreen").then((m) => ({ default: m.PeriodesScreen })));
const AffectationsScreen = lazy(() =>
  import("./screens/direction/AffectationsScreen").then((m) => ({ default: m.AffectationsScreen })),
);
const InscriptionsScreen = lazy(() =>
  import("./screens/direction/InscriptionsScreen").then((m) => ({ default: m.InscriptionsScreen })),
);
const UtilisateursScreen = lazy(() =>
  import("./screens/direction/UtilisateursScreen").then((m) => ({ default: m.UtilisateursScreen })),
);
const LiensParentsElevesScreen = lazy(() =>
  import("./screens/direction/LiensParentsElevesScreen").then((m) => ({ default: m.LiensParentsElevesScreen })),
);
const RelevesAValiderScreen = lazy(() =>
  import("./screens/direction/RelevesAValiderScreen").then((m) => ({ default: m.RelevesAValiderScreen })),
);
const ReleveReviewScreen = lazy(() =>
  import("./screens/direction/ReleveReviewScreen").then((m) => ({ default: m.ReleveReviewScreen })),
);
const EmploiDuTempsScreen = lazy(() =>
  import("./screens/direction/EmploiDuTempsScreen").then((m) => ({ default: m.EmploiDuTempsScreen })),
);
const VieScolaireDirectionScreen = lazy(() =>
  import("./screens/direction/VieScolaireScreen").then((m) => ({ default: m.VieScolaireScreen })),
);
const CahierTexteDirectionScreen = lazy(() =>
  import("./screens/direction/CahierTexteScreen").then((m) => ({ default: m.CahierTexteScreen })),
);
const ActualitesScreen = lazy(() => import("./screens/direction/ActualitesScreen").then((m) => ({ default: m.ActualitesScreen })));
const CalendrierDirectionScreen = lazy(() =>
  import("./screens/direction/CalendrierScreen").then((m) => ({ default: m.CalendrierScreen })),
);
const RessourcesDirectionScreen = lazy(() =>
  import("./screens/direction/RessourcesScreen").then((m) => ({ default: m.RessourcesScreen })),
);
const MesClassesScreen = lazy(() => import("./screens/professeur/MesClassesScreen").then((m) => ({ default: m.MesClassesScreen })));
const SaisieNotesScreen = lazy(() => import("./screens/professeur/SaisieNotesScreen").then((m) => ({ default: m.SaisieNotesScreen })));
const MonEmploiDuTempsScreen = lazy(() =>
  import("./screens/professeur/MonEmploiDuTempsScreen").then((m) => ({ default: m.MonEmploiDuTempsScreen })),
);
const VieScolaireProfesseurScreen = lazy(() =>
  import("./screens/professeur/VieScolaireScreen").then((m) => ({ default: m.VieScolaireScreen })),
);
const CahierTexteProfesseurScreen = lazy(() =>
  import("./screens/professeur/CahierTexteScreen").then((m) => ({ default: m.CahierTexteScreen })),
);
const ActualitesProfesseurScreen = lazy(() =>
  import("./screens/professeur/ActualitesScreen").then((m) => ({ default: m.ActualitesScreen })),
);
const CalendrierProfesseurScreen = lazy(() =>
  import("./screens/professeur/CalendrierScreen").then((m) => ({ default: m.CalendrierScreen })),
);
const RessourcesProfesseurScreen = lazy(() =>
  import("./screens/professeur/RessourcesScreen").then((m) => ({ default: m.RessourcesScreen })),
);
const AnnuaireScreen = lazy(() => import("./screens/AnnuaireScreen").then((m) => ({ default: m.AnnuaireScreen })));
const InvitationsScreen = lazy(() => import("./screens/direction/InvitationsScreen").then((m) => ({ default: m.InvitationsScreen })));
const ParametresScreen = lazy(() => import("./screens/direction/ParametresScreen").then((m) => ({ default: m.ParametresScreen })));
const InboxScreen = lazy(() => import("./screens/messagerie/InboxScreen").then((m) => ({ default: m.InboxScreen })));
const SentScreen = lazy(() => import("./screens/messagerie/SentScreen").then((m) => ({ default: m.SentScreen })));
const ComposeScreen = lazy(() => import("./screens/messagerie/ComposeScreen").then((m) => ({ default: m.ComposeScreen })));
const MessageDetailScreen = lazy(() =>
  import("./screens/messagerie/MessageDetailScreen").then((m) => ({ default: m.MessageDetailScreen })),
);

// Élève et parent partagent les mêmes écrans (voir screens/eleve/) : le
// parent consulte les données de l'enfant sélectionné (ChildSwitcher), au
// lieu des siennes, via ViewedEleveContext — pas de duplication d'écrans.
const EleveNotesScreen = lazy(() => import("./screens/eleve/NotesScreen").then((m) => ({ default: m.NotesScreen })));
const MatiereDetailScreen = lazy(() =>
  import("./screens/eleve/MatiereDetailScreen").then((m) => ({ default: m.MatiereDetailScreen })),
);
const EleveCahierTexteScreen = lazy(() =>
  import("./screens/eleve/CahierTexteScreen").then((m) => ({ default: m.CahierTexteScreen })),
);
const EleveRessourcesScreen = lazy(() =>
  import("./screens/eleve/RessourcesScreen").then((m) => ({ default: m.RessourcesScreen })),
);
const EleveVieScolaireScreen = lazy(() =>
  import("./screens/eleve/VieScolaireScreen").then((m) => ({ default: m.VieScolaireScreen })),
);
const EleveActualitesScreen = lazy(() =>
  import("./screens/eleve/ActualitesScreen").then((m) => ({ default: m.ActualitesScreen })),
);
const EleveCalendrierScreen = lazy(() =>
  import("./screens/eleve/CalendrierScreen").then((m) => ({ default: m.CalendrierScreen })),
);
const EleveEmploiDuTempsScreen = lazy(() =>
  import("./screens/eleve/EmploiDuTempsScreen").then((m) => ({ default: m.EmploiDuTempsScreen })),
);

// Chaque écran n'est chargé que lorsqu'on y navigue (React.lazy), plutôt que
// tout empaqueté dans un seul bundle de 600+ Ko au premier chargement —
// important pour un public avec une connexion internet coûteuse ou instable.
function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <span className="text-sm text-slate-400">Chargement…</span>
    </div>
  );
}

const messagerieRoutes = (
  <>
    <Route path="messagerie" element={<InboxScreen />} />
    <Route path="messagerie/nouveau" element={<ComposeScreen />} />
    <Route path="messagerie/envoyes" element={<SentScreen />} />
    <Route path="messagerie/:id" element={<MessageDetailScreen />} />
  </>
);

// Identiques pour élève et parent (même contrat que messagerieRoutes
// ci-dessus, déjà partagé entre direction et professeur).
function eleveParentRoutes(nav: typeof ELEVE_NAV) {
  return (
    <>
      <Route index element={<AccueilAvecSwitcher nav={nav} AccueilScreen={AccueilScreen} />} />
      <Route path="notes" element={<EleveNotesScreen />} />
      <Route path="matiere/:matiereClasseId" element={<MatiereDetailScreen />} />
      <Route path="cahier-textes" element={<EleveCahierTexteScreen />} />
      <Route path="ressources" element={<EleveRessourcesScreen />} />
      <Route path="vie-scolaire" element={<EleveVieScolaireScreen />} />
      <Route path="actualites" element={<EleveActualitesScreen />} />
      <Route path="calendrier" element={<EleveCalendrierScreen />} />
      <Route path="emploi-du-temps" element={<EleveEmploiDuTempsScreen />} />
      <Route path="annuaire" element={<AnnuaireScreen />} />
      {messagerieRoutes}
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/activation" element={<ActivationScreen />} />
          <Route path="/inscription" element={<InscriptionEtablissementScreen />} />
          <Route path="/invitation" element={<InvitationScreen />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/direction"
            element={
              <RequireRole role="direction">
                <Layout nav={DIRECTION_NAV} homePath="/direction" />
              </RequireRole>
            }
          >
            <Route index element={<AccueilScreen nav={DIRECTION_NAV} />} />
            <Route path="classes" element={<ClassesScreen />} />
            <Route path="matieres" element={<MatieresScreen />} />
            <Route path="matieres-classes" element={<MatiereClasseScreen />} />
            <Route path="periodes" element={<PeriodesScreen />} />
            <Route path="affectations" element={<AffectationsScreen />} />
            <Route path="inscriptions" element={<InscriptionsScreen />} />
            <Route path="utilisateurs" element={<UtilisateursScreen />} />
            <Route path="invitations" element={<InvitationsScreen />} />
            <Route path="parametres" element={<ParametresScreen />} />
            <Route path="liens" element={<LiensParentsElevesScreen />} />
            <Route path="releves" element={<RelevesAValiderScreen />} />
            <Route path="releves/:id" element={<ReleveReviewScreen />} />
            <Route path="emploi-du-temps" element={<EmploiDuTempsScreen />} />
            <Route path="vie-scolaire" element={<VieScolaireDirectionScreen />} />
            <Route path="cahier-textes" element={<CahierTexteDirectionScreen />} />
            <Route path="ressources" element={<RessourcesDirectionScreen />} />
            <Route path="actualites" element={<ActualitesScreen />} />
            <Route path="calendrier" element={<CalendrierDirectionScreen />} />
            <Route path="annuaire" element={<AnnuaireScreen />} />
            {messagerieRoutes}
          </Route>

          <Route
            path="/professeur"
            element={
              <RequireRole role="professeur">
                <Layout nav={PROFESSEUR_NAV} homePath="/professeur" />
              </RequireRole>
            }
          >
            <Route index element={<AccueilScreen nav={PROFESSEUR_NAV} />} />
            <Route path="mes-classes" element={<MesClassesScreen />} />
            <Route path="saisie" element={<SaisieNotesScreen />} />
            <Route path="emploi-du-temps" element={<MonEmploiDuTempsScreen />} />
            <Route path="vie-scolaire" element={<VieScolaireProfesseurScreen />} />
            <Route path="cahier-textes" element={<CahierTexteProfesseurScreen />} />
            <Route path="ressources" element={<RessourcesProfesseurScreen />} />
            <Route path="actualites" element={<ActualitesProfesseurScreen />} />
            <Route path="calendrier" element={<CalendrierProfesseurScreen />} />
            <Route path="annuaire" element={<AnnuaireScreen />} />
            {messagerieRoutes}
          </Route>

          <Route
            path="/eleve"
            element={
              <RequireRole role="eleve">
                <EleveLayout />
              </RequireRole>
            }
          >
            {eleveParentRoutes(ELEVE_NAV)}
          </Route>

          <Route
            path="/parent"
            element={
              <RequireRole role="parent">
                <ParentLayout />
              </RequireRole>
            }
          >
            {eleveParentRoutes(PARENT_NAV)}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

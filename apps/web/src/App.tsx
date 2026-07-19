import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireRole } from "./components/RequireRole";
import { RootRedirect } from "./components/RootRedirect";
import { Layout } from "./components/Layout";
import { DIRECTION_NAV, PROFESSEUR_NAV } from "./nav";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { ActivationScreen } from "./screens/auth/ActivationScreen";
import { InscriptionEtablissementScreen } from "./screens/auth/InscriptionEtablissementScreen";
import { InvitationScreen } from "./screens/auth/InvitationScreen";
import { AccueilScreen } from "./screens/AccueilScreen";
import { ClassesScreen } from "./screens/direction/ClassesScreen";
import { MatieresScreen } from "./screens/direction/MatieresScreen";
import { MatiereClasseScreen } from "./screens/direction/MatiereClasseScreen";
import { PeriodesScreen } from "./screens/direction/PeriodesScreen";
import { AffectationsScreen } from "./screens/direction/AffectationsScreen";
import { InscriptionsScreen } from "./screens/direction/InscriptionsScreen";
import { UtilisateursScreen } from "./screens/direction/UtilisateursScreen";
import { LiensParentsElevesScreen } from "./screens/direction/LiensParentsElevesScreen";
import { RelevesAValiderScreen } from "./screens/direction/RelevesAValiderScreen";
import { ReleveReviewScreen } from "./screens/direction/ReleveReviewScreen";
import { EmploiDuTempsScreen } from "./screens/direction/EmploiDuTempsScreen";
import { VieScolaireScreen as VieScolaireDirectionScreen } from "./screens/direction/VieScolaireScreen";
import { CahierTexteScreen as CahierTexteDirectionScreen } from "./screens/direction/CahierTexteScreen";
import { ActualitesScreen } from "./screens/direction/ActualitesScreen";
import { CalendrierScreen as CalendrierDirectionScreen } from "./screens/direction/CalendrierScreen";
import { RessourcesScreen as RessourcesDirectionScreen } from "./screens/direction/RessourcesScreen";
import { MesClassesScreen } from "./screens/professeur/MesClassesScreen";
import { SaisieNotesScreen } from "./screens/professeur/SaisieNotesScreen";
import { MonEmploiDuTempsScreen } from "./screens/professeur/MonEmploiDuTempsScreen";
import { VieScolaireScreen as VieScolaireProfesseurScreen } from "./screens/professeur/VieScolaireScreen";
import { CahierTexteScreen as CahierTexteProfesseurScreen } from "./screens/professeur/CahierTexteScreen";
import { ActualitesScreen as ActualitesProfesseurScreen } from "./screens/professeur/ActualitesScreen";
import { CalendrierScreen as CalendrierProfesseurScreen } from "./screens/professeur/CalendrierScreen";
import { RessourcesScreen as RessourcesProfesseurScreen } from "./screens/professeur/RessourcesScreen";
import { AnnuaireScreen } from "./screens/AnnuaireScreen";
import { InvitationsScreen } from "./screens/direction/InvitationsScreen";
import { ParametresScreen } from "./screens/direction/ParametresScreen";
import { InboxScreen } from "./screens/messagerie/InboxScreen";
import { SentScreen } from "./screens/messagerie/SentScreen";
import { ComposeScreen } from "./screens/messagerie/ComposeScreen";
import { MessageDetailScreen } from "./screens/messagerie/MessageDetailScreen";

const messagerieRoutes = (
  <>
    <Route path="messagerie" element={<InboxScreen />} />
    <Route path="messagerie/nouveau" element={<ComposeScreen />} />
    <Route path="messagerie/envoyes" element={<SentScreen />} />
    <Route path="messagerie/:id" element={<MessageDetailScreen />} />
  </>
);

export function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

import { HashRouter, Routes, Route } from "react-router-dom";
import { RequireRole } from "./components/RequireRole";
import { RootRedirect } from "./components/RootRedirect";
import { Layout } from "./components/Layout";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { ActivationScreen } from "./screens/auth/ActivationScreen";
import { DashboardScreen } from "./screens/direction/DashboardScreen";
import { ClassesScreen } from "./screens/direction/ClassesScreen";
import { MatieresScreen } from "./screens/direction/MatieresScreen";
import { MatiereClasseScreen } from "./screens/direction/MatiereClasseScreen";
import { AffectationsScreen } from "./screens/direction/AffectationsScreen";
import { InscriptionsScreen } from "./screens/direction/InscriptionsScreen";
import { UtilisateursScreen } from "./screens/direction/UtilisateursScreen";
import { LiensParentsElevesScreen } from "./screens/direction/LiensParentsElevesScreen";
import { RelevesAValiderScreen } from "./screens/direction/RelevesAValiderScreen";
import { ReleveReviewScreen } from "./screens/direction/ReleveReviewScreen";
import { MesClassesScreen } from "./screens/professeur/MesClassesScreen";
import { SaisieNotesScreen } from "./screens/professeur/SaisieNotesScreen";

const DIRECTION_NAV = [
  { to: "/direction", label: "Tableau de bord" },
  { to: "/direction/classes", label: "Classes" },
  { to: "/direction/matieres", label: "Matières" },
  { to: "/direction/matieres-classes", label: "Matières / classes" },
  { to: "/direction/affectations", label: "Affectations profs" },
  { to: "/direction/inscriptions", label: "Inscriptions élèves" },
  { to: "/direction/utilisateurs", label: "Utilisateurs" },
  { to: "/direction/liens", label: "Liens parents-élèves" },
  { to: "/direction/releves", label: "Relevés à examiner" },
];

const PROFESSEUR_NAV = [
  { to: "/professeur", label: "Mes classes" },
  { to: "/professeur/saisie", label: "Saisie des notes" },
];

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/activation" element={<ActivationScreen />} />
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/direction"
          element={
            <RequireRole role="direction">
              <Layout nav={DIRECTION_NAV} />
            </RequireRole>
          }
        >
          <Route index element={<DashboardScreen />} />
          <Route path="classes" element={<ClassesScreen />} />
          <Route path="matieres" element={<MatieresScreen />} />
          <Route path="matieres-classes" element={<MatiereClasseScreen />} />
          <Route path="affectations" element={<AffectationsScreen />} />
          <Route path="inscriptions" element={<InscriptionsScreen />} />
          <Route path="utilisateurs" element={<UtilisateursScreen />} />
          <Route path="liens" element={<LiensParentsElevesScreen />} />
          <Route path="releves" element={<RelevesAValiderScreen />} />
          <Route path="releves/:id" element={<ReleveReviewScreen />} />
        </Route>

        <Route
          path="/professeur"
          element={
            <RequireRole role="professeur">
              <Layout nav={PROFESSEUR_NAV} />
            </RequireRole>
          }
        >
          <Route index element={<MesClassesScreen />} />
          <Route path="saisie" element={<SaisieNotesScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

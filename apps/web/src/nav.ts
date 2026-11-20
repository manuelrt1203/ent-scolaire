import {
  IconBookOpen,
  IconClipboard,
  IconMegaphone,
  IconShield,
  IconSettings,
  type IconComponent,
} from "./components/icons";

export interface NavItem {
  to: string;
  label: string;
  description: string;
  category: string;
  featured?: boolean;
}

export const CATEGORIES: Record<string, string> = {
  scolarite: "Scolarité",
  enseignements: "Enseignements",
  "vie-scolaire": "Vie scolaire",
  communication: "Communication",
  administration: "Administration",
};

/** Couleur + icône par catégorie — donne aux différents espaces de l'ENT un
 * repère visuel constant (portail d'accueil, onglets, en-têtes d'écran),
 * à la manière des ENT académiques où chaque espace a sa propre teinte. */
export const CATEGORY_META: Record<string, { icon: IconComponent; badge: string; dot: string; text: string; border: string }> = {
  scolarite: {
    icon: IconBookOpen,
    badge: "bg-sky-50 text-sky-700",
    dot: "bg-sky-600",
    text: "text-sky-700",
    border: "border-sky-600",
  },
  enseignements: {
    icon: IconClipboard,
    badge: "bg-violet-50 text-violet-700",
    dot: "bg-indigo-ink",
    text: "text-indigo-ink",
    border: "border-indigo-ink",
  },
  "vie-scolaire": {
    icon: IconShield,
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-600",
    text: "text-amber-700",
    border: "border-amber-600",
  },
  communication: {
    icon: IconMegaphone,
    badge: "bg-teal-50 text-teal-700",
    dot: "bg-teal-600",
    text: "text-teal-700",
    border: "border-teal-600",
  },
  administration: {
    icon: IconSettings,
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
    text: "text-slate-700",
    border: "border-slate-500",
  },
};

export const DIRECTION_NAV: NavItem[] = [
  { to: "/direction/classes", label: "Classes", description: "Créer et organiser les classes de l'établissement", category: "scolarite" },
  { to: "/direction/inscriptions", label: "Inscriptions élèves", description: "Inscrire les élèves dans leurs classes", category: "scolarite" },
  { to: "/direction/liens", label: "Liens parents-élèves", description: "Rattacher les comptes parents à leurs enfants", category: "scolarite" },
  { to: "/direction/releves", label: "Relevés à examiner", description: "Valider et publier les relevés de notes", category: "scolarite", featured: true },
  { to: "/direction/periodes", label: "Périodes", description: "Définir les trimestres, examens et autres périodes de notation", category: "scolarite" },
  { to: "/direction/matieres", label: "Matières", description: "Gérer les matières enseignées", category: "enseignements" },
  { to: "/direction/matieres-classes", label: "Matières / classes", description: "Associer matières, classes et coefficients", category: "enseignements" },
  { to: "/direction/affectations", label: "Affectations profs", description: "Affecter les professeurs aux matières/classes", category: "enseignements" },
  { to: "/direction/emploi-du-temps", label: "Emploi du temps", description: "Consulter les emplois du temps par classe", category: "enseignements" },
  { to: "/direction/cahier-textes", label: "Cahier de textes", description: "Suivre le contenu des séances par classe", category: "enseignements" },
  { to: "/direction/ressources", label: "Ressources pédagogiques", description: "Documents déposés par les professeurs", category: "enseignements" },
  { to: "/direction/vie-scolaire", label: "Vie scolaire", description: "Absences, retards et sanctions", category: "vie-scolaire" },
  { to: "/direction/actualites", label: "Actualités", description: "Publier des informations pour l'établissement", category: "communication" },
  { to: "/direction/calendrier", label: "Calendrier", description: "Événements et dates clés de l'année", category: "communication" },
  { to: "/direction/annuaire", label: "Annuaire", description: "Coordonnées de tous les membres de l'établissement", category: "communication" },
  { to: "/direction/messagerie", label: "Messagerie", description: "Échanger des messages avec l'équipe", category: "communication", featured: true },
  { to: "/direction/utilisateurs", label: "Utilisateurs", description: "Gérer les comptes professeurs, élèves et parents", category: "administration" },
  { to: "/direction/invitations", label: "Invitations", description: "Générer des codes d'auto-inscription par rôle", category: "administration" },
  { to: "/direction/parametres", label: "Paramètres", description: "Calendrier scolaire et conservation des données", category: "administration" },
];

/** Élève et parent ont exactement le même espace (le parent consulte les
 * données de l'enfant sélectionné via ChildSwitcher) — un seul gabarit,
 * comme dans l'app mobile (components/nav.ts) où une seule NAV sert les
 * deux rôles. */
function buildEleveParentNav(base: "/eleve" | "/parent"): NavItem[] {
  return [
    { to: `${base}/notes`, label: "Notes", description: "Moyennes et relevés par matière", category: "scolarite", featured: true },
    { to: `${base}/messagerie`, label: "Messagerie", description: "Échanger des messages avec l'équipe", category: "communication", featured: true },
    { to: `${base}/emploi-du-temps`, label: "Emploi du temps", description: "Emploi du temps de la semaine", category: "enseignements" },
    { to: `${base}/vie-scolaire`, label: "Vie scolaire", description: "Absences, retards et sanctions", category: "vie-scolaire" },
    { to: `${base}/cahier-textes`, label: "Cahier de textes", description: "Contenu des séances par matière", category: "enseignements" },
    { to: `${base}/ressources`, label: "Ressources", description: "Documents déposés par les professeurs", category: "enseignements" },
    { to: `${base}/actualites`, label: "Actualités", description: "Informations publiées par l'établissement", category: "communication" },
    { to: `${base}/calendrier`, label: "Calendrier", description: "Événements et dates clés de l'année", category: "communication" },
    { to: `${base}/annuaire`, label: "Annuaire", description: "Coordonnées de l'équipe et des familles", category: "communication" },
  ];
}

export const ELEVE_NAV: NavItem[] = buildEleveParentNav("/eleve");
export const PARENT_NAV: NavItem[] = buildEleveParentNav("/parent");

export const PROFESSEUR_NAV: NavItem[] = [
  { to: "/professeur/mes-classes", label: "Mes classes", description: "Vos matières et classes affectées", category: "enseignements" },
  { to: "/professeur/saisie", label: "Saisie des notes", description: "Saisir et soumettre les notes de vos élèves", category: "scolarite", featured: true },
  { to: "/professeur/emploi-du-temps", label: "Emploi du temps", description: "Votre emploi du temps", category: "enseignements" },
  { to: "/professeur/cahier-textes", label: "Cahier de textes", description: "Renseigner le contenu de vos séances", category: "enseignements" },
  { to: "/professeur/ressources", label: "Ressources pédagogiques", description: "Déposer des documents pour vos élèves", category: "enseignements" },
  { to: "/professeur/vie-scolaire", label: "Vie scolaire", description: "Signaler absences, retards et sanctions", category: "vie-scolaire" },
  { to: "/professeur/actualites", label: "Actualités", description: "Publier des informations pour vos classes", category: "communication" },
  { to: "/professeur/calendrier", label: "Calendrier", description: "Événements et dates clés de l'année", category: "communication" },
  { to: "/professeur/annuaire", label: "Annuaire", description: "Coordonnées de l'équipe et des familles", category: "communication" },
  { to: "/professeur/messagerie", label: "Messagerie", description: "Échanger des messages", category: "communication", featured: true },
];

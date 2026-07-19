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
  { to: "/direction/parametres", label: "Paramètres", description: "Durée de conservation des données (RGPD)", category: "administration" },
];

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

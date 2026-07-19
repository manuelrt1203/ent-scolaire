export interface NavItem {
  segment: string;
  label: string;
  description: string;
  featured?: boolean;
}

export const NAV: NavItem[] = [
  { segment: "/notes", label: "Notes", description: "Vos moyennes et relevés par matière", featured: true },
  { segment: "/messagerie", label: "Messagerie", description: "Échanger des messages avec l'équipe", featured: true },
  { segment: "/emploi-du-temps", label: "Emploi du temps", description: "Votre emploi du temps de la semaine" },
  { segment: "/vie-scolaire", label: "Vie scolaire", description: "Absences, retards et sanctions" },
  { segment: "/cahier-textes", label: "Cahier de textes", description: "Contenu des séances par matière" },
  { segment: "/ressources", label: "Ressources", description: "Documents déposés par les professeurs" },
  { segment: "/actualites", label: "Actualités", description: "Informations publiées par l'établissement" },
  { segment: "/calendrier", label: "Calendrier", description: "Événements et dates clés de l'année" },
  { segment: "/annuaire", label: "Annuaire", description: "Coordonnées de l'équipe et des familles" },
];

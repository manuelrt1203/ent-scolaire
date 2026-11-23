-- Index de couverture pour toutes les FK restantes signalées par l'advisor
-- de performance (niveau INFO) : évite un scan complet de la table cible
-- à chaque jointure ou suppression en cascade sur ces colonnes.

create index if not exists idx_actualites_auteur_id on actualites(auteur_id);
create index if not exists idx_affectations_matiere_classe_id on affectations(matiere_classe_id);
create index if not exists idx_cahier_texte_professeur_id on cahier_texte(professeur_id);
create index if not exists idx_classes_annee_scolaire_id on classes(annee_scolaire_id);
create index if not exists idx_evenements_calendrier_auteur_id on evenements_calendrier(auteur_id);
create index if not exists idx_historique_releves_par on historique_releves(par);
create index if not exists idx_historique_releves_releve_id on historique_releves(releve_id);
create index if not exists idx_inscriptions_annee_scolaire_id on inscriptions(annee_scolaire_id);
create index if not exists idx_inscriptions_classe_id on inscriptions(classe_id);
create index if not exists idx_invitations_classe_id on invitations(classe_id);
create index if not exists idx_invitations_created_by on invitations(created_by);
create index if not exists idx_invitations_eleve_id on invitations(eleve_id);
create index if not exists idx_matiere_classe_annee_scolaire_id on matiere_classe(annee_scolaire_id);
create index if not exists idx_matiere_classe_matiere_id on matiere_classe(matiere_id);
create index if not exists idx_periodes_annee_scolaire_id on periodes(annee_scolaire_id);
create index if not exists idx_releves_notes_periode_id on releves_notes(periode_id);
create index if not exists idx_releves_notes_professeur_id on releves_notes(professeur_id);
create index if not exists idx_releves_notes_valide_par on releves_notes(valide_par);
create index if not exists idx_ressources_pedagogiques_professeur_id on ressources_pedagogiques(professeur_id);
create index if not exists idx_vie_scolaire_evenements_creneau_id on vie_scolaire_evenements(creneau_id);
create index if not exists idx_vie_scolaire_evenements_signale_par on vie_scolaire_evenements(signale_par);

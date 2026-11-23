-- Index manquants sur etablissement_id (colonne de scoping RLS la plus sollicitée :
-- chaque connexion filtre profiles, chaque écran filtre classes/matieres).
create index if not exists idx_profiles_etablissement_id on profiles(etablissement_id);
create index if not exists idx_classes_etablissement_id on classes(etablissement_id);
create index if not exists idx_matieres_etablissement_id on matieres(etablissement_id);
create index if not exists idx_annees_scolaires_etablissement_id on annees_scolaires(etablissement_id);

-- Corrige auth_rls_initplan : ces policies réévaluaient auth.uid() /
-- current_profile_role() / current_etablissement_id() ligne par ligne au lieu
-- d'une seule fois par requête. Envelopper l'appel dans (select ...) permet
-- au planner Postgres de le traiter comme un InitPlan (calculé une fois).
-- Comportement et sécurité inchangés : seule la forme d'évaluation change.

-- profiles
drop policy profiles_select_self on profiles;
create policy profiles_select_self on profiles for select
  using (id = (select auth.uid()));

drop policy profiles_select_professeur on profiles;
create policy profiles_select_professeur on profiles for select
  using (
    (select current_profile_role()) = 'professeur'::role_utilisateur
    and exists (
      select 1 from inscriptions i
      join affectations a on a.matiere_classe_id in (select mc.id from matiere_classe mc where mc.classe_id = i.classe_id)
      where i.eleve_id = profiles.id and a.professeur_id = (select auth.uid())
    )
  );

drop policy profiles_select_parent on profiles;
create policy profiles_select_parent on profiles for select
  using (
    (select current_profile_role()) = 'parent'::role_utilisateur
    and exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = profiles.id)
  );

drop policy profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from profiles p where p.id = (select auth.uid())));

drop policy profiles_select_correspondant on profiles;
create policy profiles_select_correspondant on profiles for select
  using (
    exists (
      select 1 from message_destinataires md
      join messages m on m.id = md.message_id
      where (m.expediteur_id = profiles.id and md.destinataire_id = (select auth.uid()))
         or (md.destinataire_id = profiles.id and m.expediteur_id = (select auth.uid()))
    )
  );

-- affectations
drop policy affectations_select on affectations;
create policy affectations_select on affectations for select
  using (professeur_id = (select auth.uid()) or (select current_profile_role()) = 'direction'::role_utilisateur);

-- liens_parents_eleves
drop policy liens_select on liens_parents_eleves;
create policy liens_select on liens_parents_eleves for select
  using (
    parent_id = (select auth.uid())
    or eleve_id = (select auth.uid())
    or (select current_profile_role()) = 'direction'::role_utilisateur
  );

-- releves_notes
drop policy releves_select_professeur on releves_notes;
create policy releves_select_professeur on releves_notes for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid())));

drop policy releves_insert_professeur on releves_notes;
create policy releves_insert_professeur on releves_notes for insert
  with check (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid())));

drop policy releves_update_professeur on releves_notes;
create policy releves_update_professeur on releves_notes for update
  using (
    exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid()))
    and statut = 'brouillon'::statut_note
  )
  with check (
    exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid()))
    and statut = any (array['brouillon'::statut_note, 'soumise'::statut_note])
  );

-- notes
drop policy notes_select_professeur on notes;
create policy notes_select_professeur on notes for select
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid())));

drop policy notes_select_eleve on notes;
create policy notes_select_eleve on notes for select
  using (eleve_id = (select auth.uid()) and releve_est_publie(releve_id));

drop policy notes_insert_professeur on notes;
create policy notes_insert_professeur on notes for insert
  with check (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note));

drop policy notes_update_professeur on notes;
create policy notes_update_professeur on notes for update
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note))
  with check (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note));

drop policy notes_delete_professeur on notes;
create policy notes_delete_professeur on notes for delete
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note));

drop policy notes_select_parent on notes;
create policy notes_select_parent on notes for select
  using (
    exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = notes.eleve_id)
    and releve_est_publie(releve_id)
  );

-- message_destinataires
drop policy destinataires_update on message_destinataires;
create policy destinataires_update on message_destinataires for update
  using (destinataire_id = (select auth.uid()))
  with check (destinataire_id = (select auth.uid()));

drop policy destinataires_select on message_destinataires;
create policy destinataires_select on message_destinataires for select
  using (
    destinataire_id = (select auth.uid())
    or exists (select 1 from messages m where m.id = message_destinataires.message_id and m.expediteur_id = (select auth.uid()))
  );

drop policy destinataires_insert on message_destinataires;
create policy destinataires_insert on message_destinataires for insert
  with check (
    exists (select 1 from messages m where m.id = message_destinataires.message_id and m.expediteur_id = (select auth.uid()))
    and profile_etablissement_id(destinataire_id) = (select current_etablissement_id())
  );

-- historique_releves
drop policy historique_select on historique_releves;
create policy historique_select on historique_releves for select
  using (
    exists (
      select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id
      where r.id = historique_releves.releve_id and a.professeur_id = (select auth.uid())
    )
    or (
      (select current_profile_role()) = 'direction'::role_utilisateur
      and exists (
        select 1 from releves_notes r
        join matiere_classe mc on mc.id = r.matiere_classe_id
        join classes c on c.id = mc.classe_id
        where r.id = historique_releves.releve_id and c.etablissement_id = (select current_etablissement_id())
      )
    )
  );

-- inscriptions
drop policy inscriptions_select on inscriptions;
create policy inscriptions_select on inscriptions for select
  using (
    eleve_id = (select auth.uid())
    or (select current_profile_role()) = 'direction'::role_utilisateur
    or exists (select 1 from liens_parents_eleves l where l.eleve_id = inscriptions.eleve_id and l.parent_id = (select auth.uid()))
    or professeur_a_acces_classe(classe_id)
  );

-- messages
drop policy messages_select on messages;
create policy messages_select on messages for select
  using (expediteur_id = (select auth.uid()) or est_destinataire_message(id));

drop policy messages_insert on messages;
create policy messages_insert on messages for insert
  with check (expediteur_id = (select auth.uid()));

-- vie_scolaire_evenements
drop policy vie_scolaire_select_eleve on vie_scolaire_evenements;
create policy vie_scolaire_select_eleve on vie_scolaire_evenements for select
  using (eleve_id = (select auth.uid()));

drop policy vie_scolaire_select_parent on vie_scolaire_evenements;
create policy vie_scolaire_select_parent on vie_scolaire_evenements for select
  using (exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = vie_scolaire_evenements.eleve_id));

drop policy vie_scolaire_insert_professeur on vie_scolaire_evenements;
create policy vie_scolaire_insert_professeur on vie_scolaire_evenements for insert
  with check (
    (select current_profile_role()) = 'professeur'::role_utilisateur
    and type = any (array['absence'::text, 'retard'::text])
    and professeur_a_acces_classe(classe_id)
    and signale_par = (select auth.uid())
  );

drop policy vie_scolaire_insert_direction on vie_scolaire_evenements;
create policy vie_scolaire_insert_direction on vie_scolaire_evenements for insert
  with check (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and classe_etablissement_id(classe_id) = (select current_etablissement_id())
    and signale_par = (select auth.uid())
  );

-- creneaux
drop policy creneaux_select_professeur on creneaux;
create policy creneaux_select_professeur on creneaux for select
  using (professeur_id = (select auth.uid()));

-- cahier_texte
drop policy cahier_texte_select_professeur on cahier_texte;
create policy cahier_texte_select_professeur on cahier_texte for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())));

drop policy cahier_texte_write_professeur on cahier_texte;
create policy cahier_texte_write_professeur on cahier_texte for all
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())));

-- actualites
drop policy actualites_write_direction on actualites;
create policy actualites_write_direction on actualites for all
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()) and auteur_id = (select auth.uid()));

-- evenements_calendrier
drop policy evenements_calendrier_write_direction on evenements_calendrier;
create policy evenements_calendrier_write_direction on evenements_calendrier for all
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()) and auteur_id = (select auth.uid()));

-- invitations
drop policy invitations_write on invitations;
create policy invitations_write on invitations for all
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()) and created_by = (select auth.uid()));

-- ressources_pedagogiques
drop policy ressources_select_professeur on ressources_pedagogiques;
create policy ressources_select_professeur on ressources_pedagogiques for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())));

drop policy ressources_write_professeur on ressources_pedagogiques;
create policy ressources_write_professeur on ressources_pedagogiques for all
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())));

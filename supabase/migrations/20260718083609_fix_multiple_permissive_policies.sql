-- Corrige multiple_permissive_policies : chaque cas ci-dessous avait 2+ policies
-- permissives évaluées pour la même action, doublant le travail du planner.
-- Deux mécanismes :
--  (A) une policy "_write ... FOR ALL" chevauchait une policy "_select" existante
--      sur SELECT -> on découpe _write en INSERT/UPDATE/DELETE (jamais SELECT).
--      Vérifié au préalable que la condition de _write est bien un sous-ensemble
--      de celle de _select (sinon, comme sur actualites/evenements_calendrier,
--      on complète d'abord _select).
--  (B) plusieurs policies SELECT/UPDATE/INSERT distinctes (une par rôle) sur la
--      même action -> fusionnées en une seule policy avec OR. Sémantiquement
--      identique : Postgres combine déjà les policies permissives multiples en
--      les OR-ant, donc une policy unique avec OR ne change aucun accès.

-- ============ actualites (select devait déjà couvrir la direction) ============
drop policy actualites_select on actualites;
create policy actualites_select on actualites for select
  using (
    etablissement_id = (select current_etablissement_id())
    and (
      cible is null
      or cible = (select current_profile_role())
      or (select current_profile_role()) = 'direction'::role_utilisateur
    )
  );

drop policy actualites_write_direction on actualites;
create policy actualites_insert_direction on actualites for insert
  with check (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
    and auteur_id = (select auth.uid())
  );
create policy actualites_update_direction on actualites for update
  using (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
  )
  with check (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
    and auteur_id = (select auth.uid())
  );
create policy actualites_delete_direction on actualites for delete
  using (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
  );

-- ============ evenements_calendrier (meme cas que actualites) ============
drop policy evenements_calendrier_select on evenements_calendrier;
create policy evenements_calendrier_select on evenements_calendrier for select
  using (
    etablissement_id = (select current_etablissement_id())
    and (
      cible is null
      or cible = (select current_profile_role())
      or (select current_profile_role()) = 'direction'::role_utilisateur
    )
  );

drop policy evenements_calendrier_write_direction on evenements_calendrier;
create policy evenements_calendrier_insert_direction on evenements_calendrier for insert
  with check (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
    and auteur_id = (select auth.uid())
  );
create policy evenements_calendrier_update_direction on evenements_calendrier for update
  using (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
  )
  with check (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
    and auteur_id = (select auth.uid())
  );
create policy evenements_calendrier_delete_direction on evenements_calendrier for delete
  using (
    (select current_profile_role()) = 'direction'::role_utilisateur
    and etablissement_id = (select current_etablissement_id())
  );

-- ============ affectations (write etait deja sous-ensemble de select) ============
drop policy affectations_write on affectations;
create policy affectations_insert on affectations for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));
create policy affectations_update on affectations for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));
create policy affectations_delete on affectations for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));

-- ============ annees_scolaires ============
drop policy annees_write on annees_scolaires;
create policy annees_insert on annees_scolaires for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy annees_update on annees_scolaires for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy annees_delete on annees_scolaires for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));

-- ============ classes ============
drop policy classes_write on classes;
create policy classes_insert on classes for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy classes_update on classes for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy classes_delete on classes for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));

-- ============ etablissements ============
drop policy etablissements_write on etablissements;
create policy etablissements_insert on etablissements for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and id = (select current_etablissement_id()));
create policy etablissements_update on etablissements for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and id = (select current_etablissement_id()));
create policy etablissements_delete on etablissements for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and id = (select current_etablissement_id()));

-- ============ inscriptions ============
drop policy inscriptions_write on inscriptions;
create policy inscriptions_insert on inscriptions for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));
create policy inscriptions_update on inscriptions for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));
create policy inscriptions_delete on inscriptions for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));

-- ============ invitations ============
drop policy invitations_write on invitations;
create policy invitations_insert on invitations for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()) and created_by = (select auth.uid()));
create policy invitations_update on invitations for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()) and created_by = (select auth.uid()));
create policy invitations_delete on invitations for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));

-- ============ liens_parents_eleves ============
drop policy liens_write on liens_parents_eleves;
create policy liens_insert on liens_parents_eleves for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and profile_etablissement_id(eleve_id) = (select current_etablissement_id()));
create policy liens_update on liens_parents_eleves for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and profile_etablissement_id(eleve_id) = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and profile_etablissement_id(eleve_id) = (select current_etablissement_id()));
create policy liens_delete on liens_parents_eleves for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and profile_etablissement_id(eleve_id) = (select current_etablissement_id()));

-- ============ matiere_classe ============
drop policy matiere_classe_write on matiere_classe;
create policy matiere_classe_insert on matiere_classe for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));
create policy matiere_classe_update on matiere_classe for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));
create policy matiere_classe_delete on matiere_classe for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()));

-- ============ matieres ============
drop policy matieres_write on matieres;
create policy matieres_insert on matieres for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy matieres_update on matieres for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));
create policy matieres_delete on matieres for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()));

-- ============ periodes ============
drop policy periodes_write on periodes;
create policy periodes_insert on periodes for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = (select current_etablissement_id())));
create policy periodes_update on periodes for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = (select current_etablissement_id())))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = (select current_etablissement_id())));
create policy periodes_delete on periodes for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = (select current_etablissement_id())));

-- ============ cahier_texte (fusion des 4 select + decoupage write) ============
drop policy cahier_texte_select_direction on cahier_texte;
drop policy cahier_texte_select_eleve on cahier_texte;
drop policy cahier_texte_select_parent on cahier_texte;
drop policy cahier_texte_select_professeur on cahier_texte;
create policy cahier_texte_select on cahier_texte for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()))
    or eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid()))
  );

drop policy cahier_texte_write_professeur on cahier_texte;
create policy cahier_texte_insert_professeur on cahier_texte for insert
  with check (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())));
create policy cahier_texte_update_professeur on cahier_texte for update
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())));
create policy cahier_texte_delete_professeur on cahier_texte for delete
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = (select auth.uid())));

-- ============ creneaux (fusion des 4 select + decoupage write) ============
drop policy creneaux_select_direction on creneaux;
drop policy creneaux_select_eleve on creneaux;
drop policy creneaux_select_parent on creneaux;
drop policy creneaux_select_professeur on creneaux;
create policy creneaux_select on creneaux for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()))
    or eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or professeur_id = (select auth.uid())
  );

drop policy creneaux_write_direction on creneaux;
create policy creneaux_insert_direction on creneaux for insert
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));
create policy creneaux_update_direction on creneaux for update
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()))
  with check ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));
create policy creneaux_delete_direction on creneaux for delete
  using ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()));

-- ============ ressources_pedagogiques (fusion des 4 select + decoupage write) ============
drop policy ressources_select_direction on ressources_pedagogiques;
drop policy ressources_select_eleve on ressources_pedagogiques;
drop policy ressources_select_parent on ressources_pedagogiques;
drop policy ressources_select_professeur on ressources_pedagogiques;
create policy ressources_select on ressources_pedagogiques for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = (select current_etablissement_id()))
    or eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id))
    or exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid()))
  );

drop policy ressources_write_professeur on ressources_pedagogiques;
create policy ressources_insert_professeur on ressources_pedagogiques for insert
  with check (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())));
create policy ressources_update_professeur on ressources_pedagogiques for update
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())));
create policy ressources_delete_professeur on ressources_pedagogiques for delete
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = (select auth.uid())));

-- ============ notes (fusion select x4, fusion update x2) ============
drop policy notes_select_direction on notes;
drop policy notes_select_eleve on notes;
drop policy notes_select_parent on notes;
drop policy notes_select_professeur on notes;
create policy notes_select on notes for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and exists (
      select 1 from releves_notes r join matiere_classe mc on mc.id = r.matiere_classe_id join classes c on c.id = mc.classe_id
      where r.id = notes.releve_id and c.etablissement_id = (select current_etablissement_id())
    ))
    or (eleve_id = (select auth.uid()) and releve_est_publie(releve_id))
    or (exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = notes.eleve_id) and releve_est_publie(releve_id))
    or exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()))
  );

drop policy notes_update_direction on notes;
drop policy notes_update_professeur on notes;
create policy notes_update on notes for update
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'soumise'::statut_note))
    or exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note)
  )
  with check (
    ((select current_profile_role()) = 'direction'::role_utilisateur and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'soumise'::statut_note))
    or exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = (select auth.uid()) and r.statut = 'brouillon'::statut_note)
  );

-- ============ profiles (fusion select x5, fusion update x2) ============
drop policy profiles_select_correspondant on profiles;
drop policy profiles_select_direction on profiles;
drop policy profiles_select_parent on profiles;
drop policy profiles_select_professeur on profiles;
drop policy profiles_select_self on profiles;
create policy profiles_select on profiles for select
  using (
    id = (select auth.uid())
    or ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
    or ((select current_profile_role()) = 'parent'::role_utilisateur and exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = profiles.id))
    or ((select current_profile_role()) = 'professeur'::role_utilisateur and exists (
      select 1 from inscriptions i join affectations a on a.matiere_classe_id in (select mc.id from matiere_classe mc where mc.classe_id = i.classe_id)
      where i.eleve_id = profiles.id and a.professeur_id = (select auth.uid())
    ))
    or exists (
      select 1 from message_destinataires md join messages m on m.id = md.message_id
      where (m.expediteur_id = profiles.id and md.destinataire_id = (select auth.uid()))
         or (md.destinataire_id = profiles.id and m.expediteur_id = (select auth.uid()))
    )
  );

drop policy profiles_update_self on profiles;
drop policy profiles_write_direction on profiles;
create policy profiles_update on profiles for update
  using (
    id = (select auth.uid())
    or ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  )
  with check (
    (id = (select auth.uid()) and role = (select p.role from profiles p where p.id = (select auth.uid())))
    or ((select current_profile_role()) = 'direction'::role_utilisateur and etablissement_id = (select current_etablissement_id()))
  );

-- ============ releves_notes (fusion select x4, fusion update x2) ============
drop policy releves_select_direction on releves_notes;
drop policy releves_select_eleve on releves_notes;
drop policy releves_select_parent on releves_notes;
drop policy releves_select_professeur on releves_notes;
create policy releves_select on releves_notes for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and exists (
      select 1 from matiere_classe mc join classes c on c.id = mc.classe_id
      where mc.id = releves_notes.matiere_classe_id and c.etablissement_id = (select current_etablissement_id())
    ))
    or (statut = 'publiee'::statut_note and eleve_a_note_sur_releve(id))
    or (statut = 'publiee'::statut_note and parent_a_enfant_note_sur_releve(id))
    or exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid()))
  );

drop policy releves_update_direction on releves_notes;
drop policy releves_update_professeur on releves_notes;
create policy releves_update on releves_notes for update
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and statut = any (array['soumise'::statut_note,'validee'::statut_note]) and exists (
      select 1 from matiere_classe mc join classes c on c.id = mc.classe_id
      where mc.id = releves_notes.matiere_classe_id and c.etablissement_id = (select current_etablissement_id())
    ))
    or (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid())) and statut = 'brouillon'::statut_note)
  )
  with check (
    ((select current_profile_role()) = 'direction'::role_utilisateur and statut = any (array['validee'::statut_note,'publiee'::statut_note,'brouillon'::statut_note]))
    or (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = (select auth.uid())) and statut = any (array['brouillon'::statut_note,'soumise'::statut_note]))
  );

-- ============ vie_scolaire_evenements (fusion select x4, fusion insert x2) ============
drop policy vie_scolaire_select_direction on vie_scolaire_evenements;
drop policy vie_scolaire_select_eleve on vie_scolaire_evenements;
drop policy vie_scolaire_select_parent on vie_scolaire_evenements;
drop policy vie_scolaire_select_professeur on vie_scolaire_evenements;
create policy vie_scolaire_select on vie_scolaire_evenements for select
  using (
    ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()))
    or eleve_id = (select auth.uid())
    or exists (select 1 from liens_parents_eleves l where l.parent_id = (select auth.uid()) and l.eleve_id = vie_scolaire_evenements.eleve_id)
    or professeur_a_acces_classe(classe_id)
  );

drop policy vie_scolaire_insert_direction on vie_scolaire_evenements;
drop policy vie_scolaire_insert_professeur on vie_scolaire_evenements;
create policy vie_scolaire_insert on vie_scolaire_evenements for insert
  with check (
    ((select current_profile_role()) = 'direction'::role_utilisateur and classe_etablissement_id(classe_id) = (select current_etablissement_id()) and signale_par = (select auth.uid()))
    or ((select current_profile_role()) = 'professeur'::role_utilisateur and type = any (array['absence'::text,'retard'::text]) and professeur_a_acces_classe(classe_id) and signale_par = (select auth.uid()))
  );

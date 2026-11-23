-- matiere_classe_write, affectations_write, inscriptions_write et
-- liens_write ne vérifiaient que current_profile_role()='direction' sans
-- filtre d'établissement (contrairement à classes_write/matieres_write) :
-- une direction pouvait théoriquement écrire/supprimer des lignes d'une
-- autre école en devinant un UUID. Découvert en préparant l'ajout de
-- Modifier/Supprimer sur les écrans admin (2026-07-17).

drop policy matiere_classe_write on matiere_classe;
create policy matiere_classe_write on matiere_classe for all
  using (current_profile_role() = 'direction' and classe_etablissement_id(classe_id) = current_etablissement_id())
  with check (current_profile_role() = 'direction' and classe_etablissement_id(classe_id) = current_etablissement_id());

drop policy affectations_write on affectations;
create policy affectations_write on affectations for all
  using (current_profile_role() = 'direction' and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id())
  with check (current_profile_role() = 'direction' and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id());

drop policy inscriptions_write on inscriptions;
create policy inscriptions_write on inscriptions for all
  using (current_profile_role() = 'direction' and classe_etablissement_id(classe_id) = current_etablissement_id())
  with check (current_profile_role() = 'direction' and classe_etablissement_id(classe_id) = current_etablissement_id());

drop policy liens_write on liens_parents_eleves;
create policy liens_write on liens_parents_eleves for all
  using (current_profile_role() = 'direction' and profile_etablissement_id(eleve_id) = current_etablissement_id())
  with check (current_profile_role() = 'direction' and profile_etablissement_id(eleve_id) = current_etablissement_id());

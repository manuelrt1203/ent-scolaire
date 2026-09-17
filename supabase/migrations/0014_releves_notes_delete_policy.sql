-- Aucune policy DELETE n'existait sur releves_notes (repéré en écrivant le
-- script de test : une suppression échouait silencieusement, laissant un
-- faux relevé "publié" en base). La direction peut déjà tout gérer sur les
-- relevés de son établissement (valider/rejeter/publier) — cohérent qu'elle
-- puisse aussi en supprimer un créé par erreur.
create policy releves_delete_direction on public.releves_notes
  for delete using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id()
  );

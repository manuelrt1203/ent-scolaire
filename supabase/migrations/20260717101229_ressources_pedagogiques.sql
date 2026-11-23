-- Dépôt de fichiers par les professeurs (cours, exercices), consultables
-- par les élèves/parents de la classe concernée. Bucket privé : tout
-- accès passe par des URL signées temporaires (createSignedUrl côté
-- client), jamais d'URL publique directe.
insert into storage.buckets (id, name, public)
values ('ressources-pedagogiques', 'ressources-pedagogiques', false);

create table ressources_pedagogiques (
  id uuid primary key default gen_random_uuid(),
  matiere_classe_id uuid not null references matiere_classe(id) on delete cascade,
  professeur_id uuid references profiles(id) on delete set null,
  titre text not null,
  chemin_fichier text not null,
  type_mime text,
  taille_octets bigint,
  created_at timestamptz not null default now()
);
create index idx_ressources_matiere_classe on ressources_pedagogiques(matiere_classe_id);
alter table ressources_pedagogiques enable row level security;

-- Même schéma que cahier_texte (M6) : professeur écrit ses propres
-- matiere_classe, direction lit (scopée établissement), élève/parent
-- lisent via les helpers d'accès classe existants.
create policy ressources_select_direction on ressources_pedagogiques for select
  using (current_profile_role() = 'direction' and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id());

create policy ressources_select_professeur on ressources_pedagogiques for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = auth.uid()));

create policy ressources_select_eleve on ressources_pedagogiques for select
  using (eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy ressources_select_parent on ressources_pedagogiques for select
  using (parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy ressources_write_professeur on ressources_pedagogiques for all
  using (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = auth.uid()))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = ressources_pedagogiques.matiere_classe_id and a.professeur_id = auth.uid()));

-- Policies storage.objects : convention de chemin
-- {matiere_classe_id}/{uuid}-{nom_fichier}, donc
-- (storage.foldername(name))[1]::uuid = matiere_classe_id.
create policy ressources_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'ressources-pedagogiques'
    and exists (select 1 from affectations a where a.matiere_classe_id = (storage.foldername(name))[1]::uuid and a.professeur_id = auth.uid())
  );

create policy ressources_storage_select on storage.objects for select
  using (
    bucket_id = 'ressources-pedagogiques'
    and (
      (current_profile_role() = 'direction' and classe_etablissement_id(matiere_classe_classe_id((storage.foldername(name))[1]::uuid)) = current_etablissement_id())
      or exists (select 1 from affectations a where a.matiere_classe_id = (storage.foldername(name))[1]::uuid and a.professeur_id = auth.uid())
      or eleve_a_acces_classe(matiere_classe_classe_id((storage.foldername(name))[1]::uuid))
      or parent_a_acces_classe(matiere_classe_classe_id((storage.foldername(name))[1]::uuid))
    )
  );

create policy ressources_storage_delete on storage.objects for delete
  using (
    bucket_id = 'ressources-pedagogiques'
    and (
      exists (select 1 from affectations a where a.matiere_classe_id = (storage.foldername(name))[1]::uuid and a.professeur_id = auth.uid())
      or (current_profile_role() = 'direction' and classe_etablissement_id(matiere_classe_classe_id((storage.foldername(name))[1]::uuid)) = current_etablissement_id())
    )
  );

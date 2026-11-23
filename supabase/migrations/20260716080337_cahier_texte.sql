create table cahier_texte (
  id uuid primary key default gen_random_uuid(),
  matiere_classe_id uuid not null references matiere_classe(id) on delete cascade,
  professeur_id uuid references profiles(id) on delete set null,
  date_seance date not null,
  contenu_seance text,
  travail_a_faire text,
  date_echeance date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_cahier_texte_updated_at before update on cahier_texte
  for each row execute function set_updated_at();

create index idx_cahier_texte_matiere_classe on cahier_texte(matiere_classe_id);

alter table cahier_texte enable row level security;

create policy cahier_texte_select_direction on cahier_texte for select
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id()
  );

create policy cahier_texte_select_professeur on cahier_texte for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = auth.uid()));

create policy cahier_texte_select_eleve on cahier_texte for select
  using (eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy cahier_texte_select_parent on cahier_texte for select
  using (parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy cahier_texte_write_professeur on cahier_texte for all
  using (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = auth.uid()))
  with check (exists (select 1 from affectations a where a.matiere_classe_id = cahier_texte.matiere_classe_id and a.professeur_id = auth.uid()));

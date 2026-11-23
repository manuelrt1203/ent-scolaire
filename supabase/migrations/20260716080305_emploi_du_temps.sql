-- Helper réutilisable : classe_id d'un matiere_classe (lookup direct, contourne RLS
-- pour éviter la récursion, même convention que classe_etablissement_id de 0005).
create function matiere_classe_classe_id(p_matiere_classe_id uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select classe_id from matiere_classe where id = p_matiere_classe_id
$$;

create table creneaux (
  id uuid primary key default gen_random_uuid(),
  matiere_classe_id uuid not null references matiere_classe(id) on delete cascade,
  professeur_id uuid not null references profiles(id) on delete cascade,
  jour_semaine smallint not null check (jour_semaine between 1 and 6),
  heure_debut time not null,
  heure_fin time not null,
  salle text,
  created_at timestamptz not null default now(),
  check (heure_fin > heure_debut)
);

create index idx_creneaux_matiere_classe on creneaux(matiere_classe_id);
create index idx_creneaux_professeur on creneaux(professeur_id);

alter table creneaux enable row level security;

create policy creneaux_select_direction on creneaux for select
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id()
  );

create policy creneaux_select_professeur on creneaux for select
  using (professeur_id = auth.uid());

create policy creneaux_select_eleve on creneaux for select
  using (eleve_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy creneaux_select_parent on creneaux for select
  using (parent_a_acces_classe(matiere_classe_classe_id(matiere_classe_id)));

create policy creneaux_write_direction on creneaux for all
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id()
  )
  with check (
    current_profile_role() = 'direction'
    and classe_etablissement_id(matiere_classe_classe_id(matiere_classe_id)) = current_etablissement_id()
  );

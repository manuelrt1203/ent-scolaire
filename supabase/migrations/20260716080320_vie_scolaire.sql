create table vie_scolaire_evenements (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete cascade,
  type text not null check (type in ('absence', 'retard', 'sanction')),
  date date not null,
  creneau_id uuid references creneaux(id) on delete set null,
  duree_minutes int,
  justifie boolean not null default false,
  motif text,
  description text,
  signale_par uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_vie_scolaire_eleve on vie_scolaire_evenements(eleve_id);
create index idx_vie_scolaire_classe on vie_scolaire_evenements(classe_id);

alter table vie_scolaire_evenements enable row level security;

create policy vie_scolaire_select_direction on vie_scolaire_evenements for select
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(classe_id) = current_etablissement_id()
  );

create policy vie_scolaire_select_professeur on vie_scolaire_evenements for select
  using (professeur_a_acces_classe(classe_id));

create policy vie_scolaire_select_eleve on vie_scolaire_evenements for select
  using (eleve_id = auth.uid());

create policy vie_scolaire_select_parent on vie_scolaire_evenements for select
  using (exists (select 1 from liens_parents_eleves l where l.parent_id = auth.uid() and l.eleve_id = vie_scolaire_evenements.eleve_id));

create policy vie_scolaire_insert_professeur on vie_scolaire_evenements for insert
  with check (
    current_profile_role() = 'professeur'
    and type in ('absence', 'retard')
    and professeur_a_acces_classe(classe_id)
    and signale_par = auth.uid()
  );

create policy vie_scolaire_insert_direction on vie_scolaire_evenements for insert
  with check (
    current_profile_role() = 'direction'
    and classe_etablissement_id(classe_id) = current_etablissement_id()
    and signale_par = auth.uid()
  );

create policy vie_scolaire_update_direction on vie_scolaire_evenements for update
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(classe_id) = current_etablissement_id()
  )
  with check (
    current_profile_role() = 'direction'
    and classe_etablissement_id(classe_id) = current_etablissement_id()
  );

create policy vie_scolaire_delete_direction on vie_scolaire_evenements for delete
  using (
    current_profile_role() = 'direction'
    and classe_etablissement_id(classe_id) = current_etablissement_id()
  );

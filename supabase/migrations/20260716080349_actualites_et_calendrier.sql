create table actualites (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  auteur_id uuid references profiles(id) on delete set null,
  titre text not null,
  contenu text not null,
  cible role_utilisateur,
  created_at timestamptz not null default now()
);

create index idx_actualites_etablissement on actualites(etablissement_id);

alter table actualites enable row level security;

create policy actualites_select on actualites for select
  using (
    etablissement_id = current_etablissement_id()
    and (cible is null or cible = current_profile_role())
  );

create policy actualites_write_direction on actualites for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id() and auteur_id = auth.uid());

create table evenements_calendrier (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  auteur_id uuid references profiles(id) on delete set null,
  titre text not null,
  description text,
  date_debut timestamptz not null,
  date_fin timestamptz not null,
  lieu text,
  cible role_utilisateur,
  created_at timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create index idx_evenements_calendrier_etablissement on evenements_calendrier(etablissement_id);
create index idx_evenements_calendrier_date_debut on evenements_calendrier(date_debut);

alter table evenements_calendrier enable row level security;

create policy evenements_calendrier_select on evenements_calendrier for select
  using (
    etablissement_id = current_etablissement_id()
    and (cible is null or cible = current_profile_role())
  );

create policy evenements_calendrier_write_direction on evenements_calendrier for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id() and auteur_id = auth.uid());

-- Schéma initial : établissements, structure scolaire, utilisateurs, notes.

create extension if not exists "pgcrypto";

create type role_utilisateur as enum ('direction', 'professeur', 'eleve', 'parent');
create type statut_note as enum ('brouillon', 'soumise', 'validee', 'publiee');

create table etablissements (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  created_at timestamptz not null default now()
);

create table annees_scolaires (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  libelle text not null,
  date_debut date not null,
  date_fin date not null,
  est_active boolean not null default true
);

create table periodes (
  id uuid primary key default gen_random_uuid(),
  annee_scolaire_id uuid not null references annees_scolaires(id) on delete cascade,
  nom text not null,
  ordre int not null,
  date_debut date not null,
  date_fin date not null
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  etablissement_id uuid not null references etablissements(id) on delete restrict,
  role role_utilisateur not null,
  nom text not null,
  prenom text not null,
  email text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  annee_scolaire_id uuid not null references annees_scolaires(id) on delete cascade,
  nom text not null,
  niveau text
);

create table matieres (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  nom text not null,
  code text
);

create table matiere_classe (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references classes(id) on delete cascade,
  matiere_id uuid not null references matieres(id) on delete cascade,
  annee_scolaire_id uuid not null references annees_scolaires(id) on delete cascade,
  coefficient numeric(4,2) not null default 1,
  unique (classe_id, matiere_id, annee_scolaire_id)
);

create table affectations (
  id uuid primary key default gen_random_uuid(),
  professeur_id uuid not null references profiles(id) on delete cascade,
  matiere_classe_id uuid not null references matiere_classe(id) on delete cascade,
  unique (professeur_id, matiere_classe_id)
);

create table inscriptions (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete cascade,
  annee_scolaire_id uuid not null references annees_scolaires(id) on delete cascade,
  date_inscription date not null default current_date,
  unique (eleve_id, annee_scolaire_id)
);

create table liens_parents_eleves (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  eleve_id uuid not null references profiles(id) on delete cascade,
  unique (parent_id, eleve_id)
);

create table releves_notes (
  id uuid primary key default gen_random_uuid(),
  matiere_classe_id uuid not null references matiere_classe(id) on delete cascade,
  periode_id uuid not null references periodes(id) on delete cascade,
  professeur_id uuid references profiles(id) on delete set null,
  statut statut_note not null default 'brouillon',
  commentaire_direction text,
  soumis_le timestamptz,
  valide_le timestamptz,
  valide_par uuid references profiles(id) on delete set null,
  publie_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matiere_classe_id, periode_id)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  releve_id uuid not null references releves_notes(id) on delete cascade,
  eleve_id uuid not null references profiles(id) on delete cascade,
  valeur numeric(4,2) check (valeur is null or (valeur >= 0 and valeur <= 20)),
  libelle text,
  coefficient_note numeric(4,2) not null default 1,
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (releve_id, eleve_id, libelle)
);

create table historique_releves (
  id uuid primary key default gen_random_uuid(),
  releve_id uuid not null references releves_notes(id) on delete cascade,
  ancien_statut statut_note,
  nouveau_statut statut_note not null,
  par uuid references profiles(id) on delete set null,
  commentaire text,
  created_at timestamptz not null default now()
);

create index idx_notes_releve on notes(releve_id);
create index idx_notes_eleve on notes(eleve_id);
create index idx_releves_matiere_classe on releves_notes(matiere_classe_id);
create index idx_affectations_prof on affectations(professeur_id);
create index idx_inscriptions_eleve on inscriptions(eleve_id);
create index idx_liens_parent on liens_parents_eleves(parent_id);
create index idx_liens_eleve on liens_parents_eleves(eleve_id);

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_releves_updated_at before update on releves_notes
  for each row execute function set_updated_at();
create trigger trg_notes_updated_at before update on notes
  for each row execute function set_updated_at();

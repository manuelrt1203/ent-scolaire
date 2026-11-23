-- Codes d'invitation : direction génère un code verrouillé sur un rôle
-- (et pour un parent, sur un élève précis), la personne saisit le code
-- dans l'app déjà installée pour créer son propre compte (edge function
-- redeem-invitation, clé service-role). Réutilisable par plusieurs
-- personnes (ex. un code "élèves Terminale A" partagé à toute la classe).
create table invitations (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references etablissements(id) on delete cascade,
  role role_utilisateur not null,
  classe_id uuid references classes(id) on delete set null,
  eleve_id uuid references profiles(id) on delete cascade,
  code text not null unique,
  actif boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (role = 'parent' and eleve_id is not null and classe_id is null)
    or (role in ('eleve', 'professeur', 'direction') and eleve_id is null)
  )
);

create index idx_invitations_code on invitations(code);
create index idx_invitations_etablissement on invitations(etablissement_id);

alter table invitations enable row level security;

create policy invitations_select on invitations for select
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());

create policy invitations_write on invitations for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id() and created_by = auth.uid());

-- Lookup public (visiteur non connecté saisissant un code) : contourne RLS
-- volontairement, mêmes conventions que annuaire_etablissement().
create function invitation_par_code(p_code text)
returns table(id uuid, role role_utilisateur, etablissement_nom text, classe_nom text, eleve_nom text, eleve_prenom text)
language sql stable security definer set search_path = public as $$
  select i.id, i.role, e.nom, c.nom, p.nom, p.prenom
  from invitations i
  join etablissements e on e.id = i.etablissement_id
  left join classes c on c.id = i.classe_id
  left join profiles p on p.id = i.eleve_id
  where i.code = p_code and i.actif = true
$$;

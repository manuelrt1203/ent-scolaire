drop function annuaire_etablissement();

create function annuaire_etablissement()
returns table(id uuid, nom text, prenom text, role role_utilisateur, email text)
language sql stable security definer set search_path = public as $$
  select id, nom, prenom, role, email
  from profiles
  where etablissement_id = current_etablissement_id() and actif = true and id <> auth.uid()
  order by nom
$$;

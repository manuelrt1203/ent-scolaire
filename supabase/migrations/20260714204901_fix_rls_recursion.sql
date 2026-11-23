-- classes_select et matiere_classe_select se référençaient mutuellement via des
-- sous-requêtes RLS-protégées, provoquant une récursion infinie. On casse le
-- cycle avec des fonctions SECURITY DEFINER qui contournent RLS sur les tables
-- qu'elles interrogent directement (même technique que current_profile_role()).

create function professeur_a_acces_classe(p_classe_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from affectations a
    join matiere_classe mc on mc.id = a.matiere_classe_id
    where mc.classe_id = p_classe_id and a.professeur_id = auth.uid()
  )
$$;

create function eleve_a_acces_classe(p_classe_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from inscriptions i where i.classe_id = p_classe_id and i.eleve_id = auth.uid())
$$;

create function parent_a_acces_classe(p_classe_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from inscriptions i
    join liens_parents_eleves l on l.eleve_id = i.eleve_id
    where i.classe_id = p_classe_id and l.parent_id = auth.uid()
  )
$$;

create function classe_etablissement_id(p_classe_id uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select etablissement_id from classes where id = p_classe_id
$$;

drop policy classes_select on classes;
create policy classes_select on classes for select
  using (
    etablissement_id = current_etablissement_id()
    and (
      current_profile_role() = 'direction'
      or professeur_a_acces_classe(id)
      or eleve_a_acces_classe(id)
      or parent_a_acces_classe(id)
    )
  );

drop policy matiere_classe_select on matiere_classe;
create policy matiere_classe_select on matiere_classe for select
  using ( classe_etablissement_id(matiere_classe.classe_id) = current_etablissement_id() );

drop policy inscriptions_select on inscriptions;
create policy inscriptions_select on inscriptions for select
  using (
    eleve_id = auth.uid()
    or current_profile_role() = 'direction'
    or exists (select 1 from liens_parents_eleves l where l.eleve_id = inscriptions.eleve_id and l.parent_id = auth.uid())
    or professeur_a_acces_classe(inscriptions.classe_id)
  );

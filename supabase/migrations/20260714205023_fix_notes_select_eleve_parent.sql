-- Les élèves/parents n'ont aucune policy SELECT sur releves_notes (ils ne
-- consultent que via la table notes / la vue v_bulletin). La sous-requête de
-- notes_select_eleve/parent vers releves_notes était donc bloquée par RLS,
-- rendant la lecture des notes publiées impossible. On contourne via une
-- fonction SECURITY DEFINER dédiée.

create function releve_est_publie(p_releve_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from releves_notes where id = p_releve_id and statut = 'publiee')
$$;

drop policy notes_select_eleve on notes;
create policy notes_select_eleve on notes for select
  using (eleve_id = auth.uid() and releve_est_publie(notes.releve_id));

drop policy notes_select_parent on notes;
create policy notes_select_parent on notes for select
  using (
    exists (select 1 from liens_parents_eleves l where l.parent_id = auth.uid() and l.eleve_id = notes.eleve_id)
    and releve_est_publie(notes.releve_id)
  );

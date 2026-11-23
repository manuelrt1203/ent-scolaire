create function eleve_a_note_sur_releve(p_releve_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from notes where releve_id = p_releve_id and eleve_id = auth.uid())
$$;

create function parent_a_enfant_note_sur_releve(p_releve_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from notes n join liens_parents_eleves l on l.eleve_id = n.eleve_id
    where n.releve_id = p_releve_id and l.parent_id = auth.uid()
  )
$$;

drop policy releves_select_eleve on releves_notes;
create policy releves_select_eleve on releves_notes for select
  using (statut = 'publiee' and eleve_a_note_sur_releve(id));

drop policy releves_select_parent on releves_notes;
create policy releves_select_parent on releves_notes for select
  using (statut = 'publiee' and parent_a_enfant_note_sur_releve(id));

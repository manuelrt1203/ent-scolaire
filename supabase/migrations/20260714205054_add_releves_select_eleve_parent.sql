-- Nécessaire pour que la vue v_bulletin (security_invoker) fonctionne pour
-- élèves/parents : sans policy SELECT sur releves_notes pour ces rôles, le
-- join notes/releves_notes de la vue ne renvoie jamais rien pour eux.

create policy releves_select_eleve on releves_notes for select
  using (
    statut = 'publiee'
    and exists (select 1 from notes n where n.releve_id = releves_notes.id and n.eleve_id = auth.uid())
  );

create policy releves_select_parent on releves_notes for select
  using (
    statut = 'publiee'
    and exists (
      select 1 from notes n join liens_parents_eleves l on l.eleve_id = n.eleve_id
      where n.releve_id = releves_notes.id and l.parent_id = auth.uid()
    )
  );

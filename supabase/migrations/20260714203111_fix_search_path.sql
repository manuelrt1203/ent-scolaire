create or replace function set_updated_at() returns trigger
  language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function calculer_moyenne_matiere(p_eleve_id uuid, p_matiere_classe_id uuid, p_periode_id uuid)
  returns numeric language sql stable set search_path = public as $$
  select round(sum(n.valeur * n.coefficient_note) / nullif(sum(n.coefficient_note) filter (where n.valeur is not null), 0), 2)
  from notes n
  join releves_notes r on r.id = n.releve_id
  where n.eleve_id = p_eleve_id
    and r.matiere_classe_id = p_matiere_classe_id
    and r.periode_id = p_periode_id
    and r.statut in ('validee', 'publiee')
$$;

create or replace function calculer_moyenne_generale(p_eleve_id uuid, p_periode_id uuid)
  returns numeric language sql stable set search_path = public as $$
  with m as (
    select mc.id, mc.coefficient, calculer_moyenne_matiere(p_eleve_id, mc.id, p_periode_id) as moyenne
    from inscriptions i
    join matiere_classe mc on mc.classe_id = i.classe_id and mc.annee_scolaire_id = i.annee_scolaire_id
    where i.eleve_id = p_eleve_id
  )
  select round(sum(moyenne * coefficient) / nullif(sum(coefficient) filter (where moyenne is not null), 0), 2)
  from m where moyenne is not null
$$;

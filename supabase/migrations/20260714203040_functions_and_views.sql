create function soumettre_releve(p_releve_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_ancien statut_note;
begin
  if current_profile_role() <> 'professeur' then
    raise exception 'Seul un professeur peut soumettre un relevé';
  end if;

  select statut into v_ancien from releves_notes r
    join affectations a on a.matiere_classe_id = r.matiere_classe_id
    where r.id = p_releve_id and a.professeur_id = auth.uid()
    for update of r;

  if v_ancien is null then
    raise exception 'Relevé introuvable ou non autorisé';
  end if;
  if v_ancien <> 'brouillon' then
    raise exception 'Seul un relevé en brouillon peut être soumis';
  end if;

  update releves_notes set statut = 'soumise', soumis_le = now(), professeur_id = auth.uid()
    where id = p_releve_id;

  insert into historique_releves (releve_id, ancien_statut, nouveau_statut, par)
    values (p_releve_id, v_ancien, 'soumise', auth.uid());
end;
$$;

create function valider_releve(p_releve_id uuid, p_commentaire text default null) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_ancien statut_note;
begin
  if current_profile_role() <> 'direction' then
    raise exception 'Seule la direction peut valider un relevé';
  end if;

  select statut into v_ancien from releves_notes where id = p_releve_id for update;
  if v_ancien is null then
    raise exception 'Relevé introuvable';
  end if;
  if v_ancien <> 'soumise' then
    raise exception 'Seul un relevé soumis peut être validé';
  end if;

  update releves_notes
    set statut = 'validee', valide_le = now(), valide_par = auth.uid(), commentaire_direction = p_commentaire
    where id = p_releve_id;

  insert into historique_releves (releve_id, ancien_statut, nouveau_statut, par, commentaire)
    values (p_releve_id, v_ancien, 'validee', auth.uid(), p_commentaire);
end;
$$;

create function rejeter_releve(p_releve_id uuid, p_commentaire text) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_ancien statut_note;
begin
  if current_profile_role() <> 'direction' then
    raise exception 'Seule la direction peut rejeter un relevé';
  end if;
  if p_commentaire is null or length(trim(p_commentaire)) = 0 then
    raise exception 'Un commentaire est requis pour un rejet';
  end if;

  select statut into v_ancien from releves_notes where id = p_releve_id for update;
  if v_ancien is null then
    raise exception 'Relevé introuvable';
  end if;
  if v_ancien not in ('soumise', 'validee') then
    raise exception 'Seul un relevé soumis ou validé peut être rejeté';
  end if;

  update releves_notes
    set statut = 'brouillon', commentaire_direction = p_commentaire,
        valide_le = null, valide_par = null, publie_le = null
    where id = p_releve_id;

  insert into historique_releves (releve_id, ancien_statut, nouveau_statut, par, commentaire)
    values (p_releve_id, v_ancien, 'brouillon', auth.uid(), p_commentaire);
end;
$$;

create function publier_releve(p_releve_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_ancien statut_note;
begin
  if current_profile_role() <> 'direction' then
    raise exception 'Seule la direction peut publier un relevé';
  end if;

  select statut into v_ancien from releves_notes where id = p_releve_id for update;
  if v_ancien is null then
    raise exception 'Relevé introuvable';
  end if;
  if v_ancien <> 'validee' then
    raise exception 'Seul un relevé validé peut être publié';
  end if;

  update releves_notes set statut = 'publiee', publie_le = now() where id = p_releve_id;

  insert into historique_releves (releve_id, ancien_statut, nouveau_statut, par)
    values (p_releve_id, v_ancien, 'publiee', auth.uid());
end;
$$;

create function calculer_moyenne_matiere(p_eleve_id uuid, p_matiere_classe_id uuid, p_periode_id uuid)
  returns numeric language sql stable as $$
  select round(sum(n.valeur * n.coefficient_note) / nullif(sum(n.coefficient_note) filter (where n.valeur is not null), 0), 2)
  from notes n
  join releves_notes r on r.id = n.releve_id
  where n.eleve_id = p_eleve_id
    and r.matiere_classe_id = p_matiere_classe_id
    and r.periode_id = p_periode_id
    and r.statut in ('validee', 'publiee')
$$;

create function calculer_moyenne_generale(p_eleve_id uuid, p_periode_id uuid)
  returns numeric language sql stable as $$
  with m as (
    select mc.id, mc.coefficient, calculer_moyenne_matiere(p_eleve_id, mc.id, p_periode_id) as moyenne
    from inscriptions i
    join matiere_classe mc on mc.classe_id = i.classe_id and mc.annee_scolaire_id = i.annee_scolaire_id
    where i.eleve_id = p_eleve_id
  )
  select round(sum(moyenne * coefficient) / nullif(sum(coefficient) filter (where moyenne is not null), 0), 2)
  from m where moyenne is not null
$$;

create view v_bulletin with (security_invoker = true) as
  select
    n.eleve_id,
    r.periode_id,
    mc.id as matiere_classe_id,
    mt.nom as matiere,
    mc.coefficient,
    r.statut,
    r.publie_le,
    calculer_moyenne_matiere(n.eleve_id, mc.id, r.periode_id) as moyenne
  from notes n
  join releves_notes r on r.id = n.releve_id
  join matiere_classe mc on mc.id = r.matiere_classe_id
  join matieres mt on mt.id = mc.matiere_id
  group by n.eleve_id, r.periode_id, mc.id, mt.nom, mc.coefficient, r.statut, r.publie_le;

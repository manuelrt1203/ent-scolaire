alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('note_publiee', 'actualite', 'cahier_texte', 'vie_scolaire', 'emploi_du_temps'));

create function public.verifier_creneau_emploi_du_temps()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_classe uuid;
  v_etablissement uuid;
  v_placement_change boolean := true;
  v_salle text;
  v_conflit_classe_ou_professeur boolean;
  v_conflit_salle boolean;
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if;
  if tg_op <> 'INSERT' then
    v_placement_change := tg_op = 'DELETE'
      or (new.matiere_classe_id, new.professeur_id, new.jour_semaine, new.heure_debut, new.heure_fin)
        is distinct from (old.matiere_classe_id, old.professeur_id, old.jour_semaine, old.heure_debut, old.heure_fin);
    if v_placement_change
      and (exists (select 1 from public.appels_seances a where a.creneau_id = old.id)
        or exists (select 1 from public.vie_scolaire_evenements v where v.creneau_id = old.id)) then
      raise exception 'Ce créneau a déjà un historique de présence. Son horaire et son professeur sont conservés.';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    if not v_placement_change and new.salle is not distinct from old.salle then return new; end if;
  end if;

  select c.id, c.etablissement_id into v_classe, v_etablissement
  from public.matiere_classe mc join public.classes c on c.id = mc.classe_id
  where mc.id = new.matiere_classe_id;

  if tg_op = 'UPDATE' and v_classe is distinct from public.matiere_classe_classe_id(old.matiere_classe_id) then
    raise exception 'Le créneau doit rester dans la même classe.';
  end if;

  if v_placement_change and not exists (
    select 1 from public.affectations a join public.profiles p on p.id = a.professeur_id
    where a.matiere_classe_id = new.matiere_classe_id and a.professeur_id = new.professeur_id
      and p.etablissement_id = v_etablissement and p.role = 'professeur' and p.actif
  ) then
    raise exception 'Choisissez un professeur affecté à cette matière et à cette classe.';
  end if;

  v_salle := nullif(lower(regexp_replace(new.salle, '[[:space:]]+', '', 'g')), '');
  perform pg_advisory_xact_lock(hashtextextended('emploi-du-temps:' || v_etablissement::text, 0));

  select bool_or(mc.classe_id = v_classe or c.professeur_id = new.professeur_id),
    bool_or(v_salle = lower(regexp_replace(c.salle, '[[:space:]]+', '', 'g')))
  into v_conflit_classe_ou_professeur, v_conflit_salle
  from public.creneaux c
  join public.matiere_classe mc on mc.id = c.matiere_classe_id
  join public.classes cl on cl.id = mc.classe_id
  join public.matiere_classe nouveau on nouveau.id = new.matiere_classe_id
  where c.id <> new.id and c.jour_semaine = new.jour_semaine
    and c.heure_debut < new.heure_fin and c.heure_fin > new.heure_debut
    and mc.annee_scolaire_id = nouveau.annee_scolaire_id
    and cl.etablissement_id = v_etablissement;

  if v_placement_change and v_conflit_classe_ou_professeur then
    raise exception 'Un autre cours occupe déjà cette classe ou ce professeur sur cet horaire.';
  end if;
  if v_conflit_salle then
    raise exception 'La salle est déjà réservée sur cet horaire.';
  end if;

  return new;
end;
$$;

create trigger verifier_creneau_emploi_du_temps before insert or update or delete on public.creneaux
for each row execute function public.verifier_creneau_emploi_du_temps();

create function public.notifier_changement_emploi_du_temps()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_creneau public.creneaux;
  v_titre text;
  v_jours constant text[] := array['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  v_horaire text;
  v_ancien_horaire text;
begin
  if tg_op = 'DELETE' then
    if pg_trigger_depth() > 1 then return null; end if;
    v_creneau := old;
    v_titre := 'Cours retiré de l’emploi du temps';
  else
    v_creneau := new;
    v_titre := case when tg_op = 'INSERT' then 'Cours ajouté à l’emploi du temps' else 'Cours modifié dans l’emploi du temps' end;
  end if;
  if tg_op = 'UPDATE' and (new.matiere_classe_id, new.professeur_id, new.jour_semaine, new.heure_debut, new.heure_fin, new.salle)
    is not distinct from (old.matiere_classe_id, old.professeur_id, old.jour_semaine, old.heure_debut, old.heure_fin, old.salle) then
    return null;
  end if;

  v_horaire := v_jours[v_creneau.jour_semaine] || ' ' || left(v_creneau.heure_debut::text, 5)
    || '–' || left(v_creneau.heure_fin::text, 5) || ' · ' || coalesce('Salle ' || v_creneau.salle, 'Salle à préciser');
  if tg_op = 'UPDATE' and (old.jour_semaine, old.heure_debut, old.heure_fin, old.salle)
    is distinct from (new.jour_semaine, new.heure_debut, new.heure_fin, new.salle) then
    v_ancien_horaire := v_jours[old.jour_semaine] || ' ' || left(old.heure_debut::text, 5)
      || '–' || left(old.heure_fin::text, 5) || ' · ' || coalesce('Salle ' || old.salle, 'Salle à préciser');
    v_horaire := 'Avant ' || v_ancien_horaire || chr(10) || 'Maintenant ' || v_horaire;
  end if;

  with cours as (
    select cl.id as classe_id, cl.etablissement_id, mc.annee_scolaire_id,
      concat_ws(' · ', m.nom, cl.nom) || chr(10) || v_horaire as contenu
    from public.matiere_classe mc
    join public.matieres m on m.id = mc.matiere_id
    join public.classes cl on cl.id = mc.classe_id
    join public.annees_scolaires a on a.id = mc.annee_scolaire_id and a.est_active
    where mc.id = v_creneau.matiere_classe_id
  ), eleves as (
    select p.id
    from cours c
    join public.inscriptions i on i.classe_id = c.classe_id and i.annee_scolaire_id = c.annee_scolaire_id
    join public.profiles p on p.id = i.eleve_id and p.etablissement_id = c.etablissement_id
    where p.role = 'eleve' and p.actif
  ), parents as (
    select distinct on (p.id) p.id, e.id as enfant_id
    from eleves e join public.liens_parents_eleves l on l.eleve_id = e.id
    join public.profiles p on p.id = l.parent_id
    join cours c on c.etablissement_id = p.etablissement_id
    where p.role = 'parent' and p.actif
    order by p.id, e.id
  ), destinataires as (
    select e.id, '/eleve/emploi-du-temps' as lien, v_titre as titre from eleves e
    union all
    select p.id, '/parent/emploi-du-temps?enfant=' || p.enfant_id, v_titre from parents p
    union all
    select p.id, '/professeur/emploi-du-temps',
      case when tg_op = 'UPDATE' and p.id <> v_creneau.professeur_id then 'Cours réattribué' else v_titre end
    from public.profiles p join cours c on c.etablissement_id = p.etablissement_id
    where p.role = 'professeur' and p.actif and (
      p.id = v_creneau.professeur_id or (tg_op = 'UPDATE' and p.id = old.professeur_id)
    )
  )
  insert into public.notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select d.id, c.etablissement_id, 'emploi_du_temps', d.titre, c.contenu, d.lien
  from destinataires d cross join cours c;

  return null;
end;
$$;

create trigger notifier_changement_emploi_du_temps after insert or update or delete on public.creneaux
for each row execute function public.notifier_changement_emploi_du_temps();

revoke execute on function public.verifier_creneau_emploi_du_temps(), public.notifier_changement_emploi_du_temps()
from public, anon, authenticated;

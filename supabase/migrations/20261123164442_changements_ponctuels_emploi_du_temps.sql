create table public.exceptions_creneaux (
  creneau_id uuid not null references public.creneaux(id) on delete cascade,
  date date not null,
  annule boolean not null,
  heure_debut time,
  heure_fin time,
  salle text,
  primary key (creneau_id, date),
  check ((annule and heure_debut is null and heure_fin is null and salle is null)
    or (not annule and heure_debut is not null and heure_fin is not null and heure_fin > heure_debut))
);
create index exceptions_creneaux_par_date on public.exceptions_creneaux(date);
alter table public.exceptions_creneaux enable row level security;
revoke all on public.exceptions_creneaux from public, anon, authenticated;
grant select on public.exceptions_creneaux to authenticated;
create policy exceptions_creneaux_lecture on public.exceptions_creneaux
for select to authenticated
using (exists (select 1 from public.creneaux c where c.id = exceptions_creneaux.creneau_id));

create function public.planifier_exception_creneau(
  p_creneau_id uuid, p_date date, p_action text, p_debut time, p_fin time, p_salle text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_creneau public.creneaux;
  v_exception public.exceptions_creneaux;
  v_classe record;
  v_debut time;
  v_fin time;
  v_salle text;
  v_titre text;
  v_contenu text;
begin
  if (select auth.uid()) is null or public.current_profile_role() is distinct from 'direction' then
    raise exception 'Seule la direction peut modifier la séance.';
  end if;

  select c.* into v_creneau
  from public.creneaux c
  join public.matiere_classe mc on mc.id = c.matiere_classe_id
  join public.classes cl on cl.id = mc.classe_id
  join public.annees_scolaires a on a.id = mc.annee_scolaire_id
  where c.id = p_creneau_id and cl.etablissement_id = public.current_etablissement_id()
    and a.est_active and p_date between a.date_debut and a.date_fin
    and extract(isodow from p_date) = c.jour_semaine
  for share of c;
  if not found then
    raise exception 'Choisissez un cours de votre établissement et une date correspondant à son jour de cours.';
  end if;

  select cl.id, cl.etablissement_id, cl.nom, mc.annee_scolaire_id, m.nom as matiere into v_classe
  from public.matiere_classe mc
  join public.classes cl on cl.id = mc.classe_id
  join public.matieres m on m.id = mc.matiere_id
  where mc.id = v_creneau.matiere_classe_id;

  if p_action is null or p_action not in ('modifier', 'annuler', 'retablir') then
    raise exception 'Action inconnue.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('emploi-du-temps:' || v_classe.etablissement_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_creneau_id::text || ':' || p_date::text, 0));
  if exists (select 1 from public.appels_seances where creneau_id = p_creneau_id and date = p_date)
    or exists (select 1 from public.vie_scolaire_evenements where creneau_id = p_creneau_id and date = p_date) then
    raise exception 'Cette séance a déjà un historique de présence.';
  end if;

  select * into v_exception from public.exceptions_creneaux where creneau_id = p_creneau_id and date = p_date;
  if (p_action = 'retablir' and v_exception.creneau_id is null)
    or (p_action = 'annuler' and v_exception.annule) then return; end if;

  if p_action <> 'annuler' then
    v_debut := case when p_action = 'retablir' then v_creneau.heure_debut else p_debut end;
    v_fin := case when p_action = 'retablir' then v_creneau.heure_fin else p_fin end;
    v_salle := case when p_action = 'retablir' then v_creneau.salle else nullif(btrim(p_salle), '') end;
    if v_debut is null or v_fin is null or v_fin <= v_debut then
      raise exception 'L’heure de fin doit suivre l’heure de début.';
    end if;
    if p_action = 'modifier' and not coalesce(v_exception.annule, false)
      and (coalesce(v_exception.heure_debut, v_creneau.heure_debut), coalesce(v_exception.heure_fin, v_creneau.heure_fin),
        case when v_exception.creneau_id is null then v_creneau.salle else v_exception.salle end)
      is not distinct from (v_debut, v_fin, v_salle) then return; end if;

    if exists (
      select 1 from public.creneaux c
      join public.matiere_classe mc on mc.id = c.matiere_classe_id
      join public.classes cl on cl.id = mc.classe_id
      left join public.exceptions_creneaux x on x.creneau_id = c.id and x.date = p_date
      where c.id <> p_creneau_id and c.jour_semaine = v_creneau.jour_semaine
        and mc.annee_scolaire_id = v_classe.annee_scolaire_id and cl.etablissement_id = v_classe.etablissement_id
        and not coalesce(x.annule, false)
        and coalesce(x.heure_debut, c.heure_debut) < v_fin and coalesce(x.heure_fin, c.heure_fin) > v_debut
        and (c.professeur_id = v_creneau.professeur_id or cl.id = v_classe.id
          or nullif(lower(regexp_replace(v_salle, '[[:space:]]+', '', 'g')), '') =
            lower(regexp_replace(case when x.creneau_id is null then c.salle else x.salle end, '[[:space:]]+', '', 'g')))
    ) then
      raise exception 'La classe, le professeur ou la salle est déjà occupé à cet horaire pour cette date.';
    end if;
  end if;

  if p_action = 'retablir' then
    delete from public.exceptions_creneaux where creneau_id = p_creneau_id and date = p_date;
    v_titre := 'Séance rétablie';
  else
    insert into public.exceptions_creneaux (creneau_id, date, annule, heure_debut, heure_fin, salle)
    values (p_creneau_id, p_date, p_action = 'annuler', v_debut, v_fin, v_salle)
    on conflict (creneau_id, date) do update set
      annule = excluded.annule, heure_debut = excluded.heure_debut, heure_fin = excluded.heure_fin, salle = excluded.salle;
    v_titre := case when p_action = 'annuler' then 'Séance annulée' else 'Horaire ponctuel modifié' end;
  end if;

  v_contenu := v_classe.matiere || ' · ' || v_classe.nom || ' · ' || to_char(p_date, 'DD/MM/YYYY')
    || chr(10) || case when p_action = 'annuler' then 'Cours annulé'
      else left(v_debut::text, 5) || '–' || left(v_fin::text, 5) || ' · ' || coalesce('Salle ' || v_salle, 'Salle à préciser') end;

  with eleves as (
    select p.id from public.inscriptions i
    join public.profiles p on p.id = i.eleve_id and p.actif and p.role = 'eleve'
      and p.etablissement_id = v_classe.etablissement_id
    where i.classe_id = v_classe.id and i.annee_scolaire_id = v_classe.annee_scolaire_id
  ), parents as (
    select distinct on (p.id) p.id, e.id as enfant_id
    from eleves e join public.liens_parents_eleves l on l.eleve_id = e.id
    join public.profiles p on p.id = l.parent_id and p.actif and p.role = 'parent'
      and p.etablissement_id = v_classe.etablissement_id
    order by p.id, e.id
  ), destinataires as (
    select id, '/eleve/emploi-du-temps?semaine=' || p_date as lien from eleves
    union all
    select id, '/parent/emploi-du-temps?enfant=' || enfant_id || '&semaine=' || p_date from parents
    union all
    select id, '/professeur/emploi-du-temps?semaine=' || p_date from public.profiles
    where id = v_creneau.professeur_id and actif and etablissement_id = v_classe.etablissement_id
  )
  insert into public.notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select id, v_classe.etablissement_id, 'emploi_du_temps', v_titre, v_contenu, lien from destinataires;
end;
$$;

create function public.verifier_appel_seance_non_annulee()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.creneau_id is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.creneau_id::text || ':' || new.date::text, 0));
  if exists (
    select 1 from public.exceptions_creneaux x where x.creneau_id = new.creneau_id and x.date = new.date and x.annule
  ) then raise exception 'L’appel est indisponible pour une séance annulée.'; end if;
  return new;
end;
$$;

create trigger verifier_appel_seance_non_annulee before insert or update on public.appels_seances
for each row execute function public.verifier_appel_seance_non_annulee();

create trigger verifier_presence_seance_non_annulee before insert or update of creneau_id, date
on public.vie_scolaire_evenements for each row execute function public.verifier_appel_seance_non_annulee();

-- Les changements récurrents tiennent également compte des déplacements déjà prévus.
create function public.verifier_conflit_seances_ponctuelles()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_classe uuid;
  v_etablissement uuid;
  v_annee uuid;
begin
  if tg_op = 'DELETE' then
    if pg_trigger_depth() = 1 and exists (select 1 from public.exceptions_creneaux where creneau_id = old.id) then
      raise exception 'Des changements ponctuels sont rattachés à ce cours. Rétablissez ces séances avant de supprimer le créneau.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if (new.matiere_classe_id, new.professeur_id, new.jour_semaine, new.heure_debut, new.heure_fin, new.salle)
      is not distinct from (old.matiere_classe_id, old.professeur_id, old.jour_semaine, old.heure_debut, old.heure_fin, old.salle) then return new; end if;
    if (new.matiere_classe_id, new.jour_semaine) is distinct from (old.matiere_classe_id, old.jour_semaine)
      and exists (select 1 from public.exceptions_creneaux where creneau_id = old.id) then
      raise exception 'Rétablissez les séances modifiées avant de changer le jour ou la matière du cours.';
    end if;
  end if;

  select cl.id, cl.etablissement_id, mc.annee_scolaire_id into v_classe, v_etablissement, v_annee
  from public.matiere_classe mc join public.classes cl on cl.id = mc.classe_id where mc.id = new.matiere_classe_id;
  perform pg_advisory_xact_lock(hashtextextended('emploi-du-temps:' || v_etablissement::text, 0));
  if exists (
    select 1 from public.creneaux c
    join public.matiere_classe mc on mc.id = c.matiere_classe_id
    join public.classes cl on cl.id = mc.classe_id
    join lateral (
      select date from public.exceptions_creneaux where creneau_id = c.id
      union
      select date from public.exceptions_creneaux where creneau_id = new.id
    ) dates on true
    left join public.exceptions_creneaux x on x.creneau_id = c.id and x.date = dates.date
    left join public.exceptions_creneaux propre on propre.creneau_id = new.id and propre.date = dates.date
    where c.id <> new.id and c.jour_semaine = new.jour_semaine
      and mc.annee_scolaire_id = v_annee and cl.etablissement_id = v_etablissement
      and not coalesce(x.annule, false) and not coalesce(propre.annule, false)
      and coalesce(x.heure_debut, c.heure_debut) < coalesce(propre.heure_fin, new.heure_fin)
      and coalesce(x.heure_fin, c.heure_fin) > coalesce(propre.heure_debut, new.heure_debut)
      and (c.professeur_id = new.professeur_id or cl.id = v_classe
        or nullif(lower(regexp_replace(case when propre.creneau_id is null then new.salle else propre.salle end, '[[:space:]]+', '', 'g')), '') =
           lower(regexp_replace(case when x.creneau_id is null then c.salle else x.salle end, '[[:space:]]+', '', 'g')))
  ) then raise exception 'Un changement ponctuel occupe déjà cette classe, ce professeur ou cette salle sur cet horaire.'; end if;
  return new;
end;
$$;

create trigger verifier_conflit_seances_ponctuelles before insert or update or delete on public.creneaux
for each row execute function public.verifier_conflit_seances_ponctuelles();

revoke execute on function public.planifier_exception_creneau(uuid,date,text,time,time,text) from public, anon;
grant execute on function public.planifier_exception_creneau(uuid,date,text,time,time,text) to authenticated;
revoke execute on function public.verifier_appel_seance_non_annulee(), public.verifier_conflit_seances_ponctuelles()
from public, anon, authenticated;

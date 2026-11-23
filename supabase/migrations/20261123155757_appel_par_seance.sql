create table public.appels_seances (
  creneau_id uuid not null references public.creneaux(id) on delete cascade,
  date date not null,
  version integer not null default 1 check (version > 0),
  primary key (creneau_id, date)
);

alter table public.appels_seances enable row level security;
revoke all on public.appels_seances from anon, authenticated;
grant select on public.appels_seances to authenticated;

create policy appels_seances_lecture_professeur on public.appels_seances
for select to authenticated
using (exists (
  select 1 from public.creneaux c
  where c.id = appels_seances.creneau_id and c.professeur_id = (select auth.uid())
));

create policy appels_seances_lecture_direction on public.appels_seances
for select to authenticated
using (
  (select public.current_profile_role()) = 'direction'
  and exists (
    select 1 from public.creneaux c
    join public.matiere_classe mc on mc.id = c.matiere_classe_id
    join public.classes cl on cl.id = mc.classe_id
    where c.id = appels_seances.creneau_id
      and cl.etablissement_id = (select public.current_etablissement_id())
  )
);

create unique index vie_scolaire_presence_par_seance
on public.vie_scolaire_evenements (creneau_id, date, eleve_id)
where creneau_id is not null and type in ('absence', 'retard');

-- Les signalements individuels continuent d'utiliser l'API existante.
-- L'appel complet est enregistré par la fonction transactionnelle ci-dessous.
create policy vie_scolaire_appel_via_fonction on public.vie_scolaire_evenements
as restrictive for insert to authenticated
with check (creneau_id is null or (select public.current_profile_role()) = 'direction');

create function public.enregistrer_appel_seance(
  p_creneau_id uuid, p_date date, p_version integer, p_presences jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_professeur uuid := auth.uid();
  v_classe uuid;
  v_annee uuid;
  v_version integer;
begin
  select mc.classe_id, mc.annee_scolaire_id into v_classe, v_annee
  from public.creneaux c
  join public.matiere_classe mc on mc.id = c.matiere_classe_id
  join public.annees_scolaires a on a.id = mc.annee_scolaire_id
  join public.profiles p on p.id = c.professeur_id and p.etablissement_id = a.etablissement_id
  where c.id = p_creneau_id and c.professeur_id = v_professeur
    and p.actif and p.role = 'professeur'
    and p_date between a.date_debut and a.date_fin
    and extract(isodow from p_date) = c.jour_semaine
  for share of c;

  if not found then
    raise exception 'Choisissez un créneau qui vous est attribué et une date correspondant au cours.';
  end if;

  if jsonb_typeof(p_presences) is distinct from 'array'
    or jsonb_array_length(p_presences) = 0 then
    raise exception 'La liste des élèves est vide.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_creneau_id::text || ':' || p_date::text, 0));
  select a.version into v_version from public.appels_seances a
  where a.creneau_id = p_creneau_id and a.date = p_date;
  if p_version is distinct from coalesce(v_version, 0) then
    raise exception 'Cet appel a changé. Rechargez la séance avant de réessayer.';
  end if;

  if (
    select count(*) <> count(distinct p.eleve_id)
      or count(*) <> (select count(*) from public.inscriptions i where i.classe_id = v_classe and i.annee_scolaire_id = v_annee)
      or bool_or(i.eleve_id is null or p.statut is null or p.statut not in ('present', 'absence', 'retard')
        or case when p.statut = 'retard' then coalesce(p.minutes <= 0, true) else p.minutes is not null end)
    from jsonb_to_recordset(p_presences) as p(eleve_id uuid, statut text, minutes integer)
    left join public.inscriptions i
      on i.eleve_id = p.eleve_id and i.classe_id = v_classe and i.annee_scolaire_id = v_annee
  ) then
    raise exception 'Vérifiez la liste des élèves inscrits et la durée des retards.';
  end if;

  -- Une décision ou une pièce jointe concurrente doit être visible avant la modification.
  perform 1 from public.vie_scolaire_evenements v
  where v.creneau_id = p_creneau_id and v.date = p_date and v.type in ('absence', 'retard')
  for update;

  if exists (
    select 1 from public.vie_scolaire_evenements v
    join jsonb_to_recordset(p_presences) as p(eleve_id uuid, statut text, minutes integer)
      on p.eleve_id = v.eleve_id
    where v.creneau_id = p_creneau_id and v.date = p_date and v.type in ('absence', 'retard')
      and (v.justifie or v.justificatif_chemin is not null)
      and (v.type is distinct from p.statut or v.duree_minutes is distinct from p.minutes)
  ) then
    raise exception 'Une absence ou un retard déjà justifié ou avec une pièce jointe doit être traité par la direction.';
  end if;

  delete from public.vie_scolaire_evenements v
  using jsonb_to_recordset(p_presences) as p(eleve_id uuid, statut text, minutes integer)
  where v.creneau_id = p_creneau_id and v.date = p_date and v.type in ('absence', 'retard')
    and v.eleve_id = p.eleve_id and p.statut = 'present';

  insert into public.vie_scolaire_evenements as v
    (eleve_id, classe_id, creneau_id, date, type, duree_minutes, signale_par)
  select p.eleve_id, v_classe, p_creneau_id, p_date, p.statut, p.minutes, v_professeur
  from jsonb_to_recordset(p_presences) as p(eleve_id uuid, statut text, minutes integer)
  where p.statut <> 'present'
  on conflict (creneau_id, date, eleve_id) where creneau_id is not null and type in ('absence', 'retard')
  do update set type = excluded.type, duree_minutes = excluded.duree_minutes
  where (v.type, v.duree_minutes) is distinct from (excluded.type, excluded.duree_minutes);

  insert into public.appels_seances as a (creneau_id, date)
  values (p_creneau_id, p_date)
  on conflict (creneau_id, date) do update set version = a.version + 1;
end;
$$;

revoke execute on function public.enregistrer_appel_seance(uuid, date, integer, jsonb) from public, anon;
grant execute on function public.enregistrer_appel_seance(uuid, date, integer, jsonb) to authenticated;

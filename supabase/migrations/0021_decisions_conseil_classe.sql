create table public.decisions_conseil_classe (
  periode_id uuid not null references public.periodes(id) on delete cascade,
  inscription_id uuid not null references public.inscriptions(id) on delete cascade,
  decision text not null check (char_length(btrim(decision)) between 1 and 1000),
  publiee boolean not null default false,
  primary key (periode_id, inscription_id)
);

create index decisions_conseil_classe_inscription_idx on public.decisions_conseil_classe (inscription_id);

alter table public.decisions_conseil_classe enable row level security;
revoke all on public.decisions_conseil_classe from public, anon, authenticated;
grant select, insert, update on public.decisions_conseil_classe to authenticated;

create policy decisions_conseil_direction on public.decisions_conseil_classe
for all to authenticated
using (
  (select public.current_profile_role()) = 'direction'
  and exists (
    select 1 from public.inscriptions i
    join public.classes c on c.id = i.classe_id and c.annee_scolaire_id = i.annee_scolaire_id
    where i.id = decisions_conseil_classe.inscription_id
      and c.etablissement_id = (select public.current_etablissement_id())
  )
)
with check (
  (select public.current_profile_role()) = 'direction'
  and exists (
    select 1 from public.inscriptions i
    join public.classes c on c.id = i.classe_id and c.annee_scolaire_id = i.annee_scolaire_id
    join public.periodes p on p.annee_scolaire_id = i.annee_scolaire_id
    join public.etablissements e on e.id = c.etablissement_id
    where i.id = decisions_conseil_classe.inscription_id and p.id = decisions_conseil_classe.periode_id
      and c.etablissement_id = (select public.current_etablissement_id())
      and c.cycle = 'lycee' and e.pays_calendrier = 'GA'
  )
);

create policy decisions_conseil_famille on public.decisions_conseil_classe
for select to authenticated
using (
  publiee
  and exists (
    select 1 from public.inscriptions i
    join public.classes c on c.id = i.classe_id and c.annee_scolaire_id = i.annee_scolaire_id
    where i.id = decisions_conseil_classe.inscription_id
      and c.etablissement_id = (select public.current_etablissement_id())
      and (
        ((select public.current_profile_role()) = 'eleve' and i.eleve_id = (select auth.uid()))
        or ((select public.current_profile_role()) = 'parent' and exists (
          select 1 from public.liens_parents_eleves l
          where l.eleve_id = i.eleve_id and l.parent_id = (select auth.uid())
        ))
      )
  )
);

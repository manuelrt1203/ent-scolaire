alter table public.periodes
  add column fin_compositions date,
  add column echeance_bulletins date generated always as (fin_compositions + 14) stored,
  add constraint periodes_fin_compositions_apres_debut
    check (fin_compositions >= date_debut);

create table public.remises_bulletins (
  periode_id uuid not null references public.periodes(id) on delete cascade,
  inscription_id uuid not null references public.inscriptions(id) on delete cascade,
  destinataire text not null check (destinataire in ('eleve', 'tuteur')),
  remis_le timestamptz not null default now(),
  primary key (periode_id, inscription_id)
);

create index remises_bulletins_inscription_idx on public.remises_bulletins (inscription_id);

alter table public.remises_bulletins enable row level security;
revoke all on public.remises_bulletins from public, anon, authenticated;
grant select, delete on public.remises_bulletins to authenticated;
grant insert (periode_id, inscription_id, destinataire) on public.remises_bulletins to authenticated;

create policy remises_bulletins_direction on public.remises_bulletins
for all to authenticated
using (
  (select public.current_profile_role()) = 'direction'
  and exists (
    select 1 from public.inscriptions i
    join public.periodes p on p.annee_scolaire_id = i.annee_scolaire_id
    join public.classes c on c.id = i.classe_id and c.annee_scolaire_id = i.annee_scolaire_id
    where i.id = remises_bulletins.inscription_id and p.id = remises_bulletins.periode_id
      and c.etablissement_id = (select public.current_etablissement_id())
  )
)
with check (
  (select public.current_profile_role()) = 'direction'
  and exists (
    select 1 from public.inscriptions i
    join public.periodes p on p.annee_scolaire_id = i.annee_scolaire_id
    join public.classes c on c.id = i.classe_id and c.annee_scolaire_id = i.annee_scolaire_id
    join public.matiere_classe mc on mc.classe_id = c.id
    join public.releves_notes r on r.matiere_classe_id = mc.id and r.periode_id = p.id
    join public.notes n on n.releve_id = r.id and n.eleve_id = i.eleve_id
    where i.id = remises_bulletins.inscription_id and p.id = remises_bulletins.periode_id
      and c.etablissement_id = (select public.current_etablissement_id())
      and r.statut = 'publiee' and n.valeur is not null
  )
);

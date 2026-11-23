alter table public.etablissements
  add column pays_calendrier text not null default 'FR',
  add constraint etablissements_pays_calendrier_valide
    check (pays_calendrier in ('FR', 'CG'));

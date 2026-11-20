alter table public.etablissements
  drop constraint etablissements_pays_calendrier_valide,
  add constraint etablissements_pays_calendrier_valide
    check (pays_calendrier in ('FR', 'CG', 'GA'));

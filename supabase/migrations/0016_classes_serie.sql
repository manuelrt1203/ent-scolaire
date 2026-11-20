alter table public.classes
  add column serie text,
  add constraint classes_serie_non_vide
    check (serie is null or btrim(serie) <> '');

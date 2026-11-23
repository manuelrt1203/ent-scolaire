alter table public.notes
  add column devoir_1 numeric(4,2) check (devoir_1 between 0 and 20),
  add column devoir_2 numeric(4,2) check (devoir_2 between 0 and 20),
  add column devoir_departemental numeric(4,2) check (devoir_departemental between 0 and 20),
  add column composition numeric(4,2) check (composition between 0 and 20);

create function public.calculer_note_evaluations_lycee() returns trigger
language plpgsql set search_path = '' as $$
begin
  if num_nonnulls(new.devoir_1, new.devoir_2, new.devoir_departemental, new.composition) > 0 then
    new.valeur := round(((new.devoir_1 + new.devoir_2 + new.devoir_departemental) / 3
      + new.composition) / 2, 2);
  elsif tg_op = 'UPDATE' then
    if num_nonnulls(old.devoir_1, old.devoir_2, old.devoir_departemental, old.composition) > 0 then
      new.valeur := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger notes_calcul_evaluations_lycee
before insert or update on public.notes
for each row execute function public.calculer_note_evaluations_lycee();

create function public.verifier_releve_evaluations_lycee() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.notes
    where releve_id = new.id and valeur is null
      and num_nonnulls(devoir_1, devoir_2, devoir_departemental, composition) > 0
  ) then
    raise exception 'Les évaluations détaillées du relevé doivent être complètes.';
  end if;
  return new;
end;
$$;

create trigger releves_verifier_evaluations_lycee
before update of statut on public.releves_notes
for each row
when (old.statut is distinct from new.statut and new.statut in ('soumise', 'validee', 'publiee'))
execute function public.verifier_releve_evaluations_lycee();

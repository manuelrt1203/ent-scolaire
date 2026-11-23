create function public.notifier_justificatif_vie_scolaire()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_etablissement uuid;
  v_titre text;
begin
  select c.etablissement_id into v_etablissement
    from public.classes c where c.id = new.classe_id;

  if new.justificatif_chemin is distinct from old.justificatif_chemin then
    if not new.justifie and new.justificatif_motif_refus is null then
      insert into public.notifications (destinataire_id, etablissement_id, type, titre, lien)
      select p.id, v_etablissement, 'vie_scolaire', 'Justificatif à examiner',
        '/direction/vie-scolaire?classe=' || new.classe_id || '&justificatifs=attente'
      from public.profiles p
      where p.etablissement_id = v_etablissement and p.role = 'direction' and p.actif;
    end if;
    return new;
  end if;

  if new.justifie and not old.justifie then
    v_titre := 'Justificatif validé';
  elsif new.justificatif_motif_refus is not null and old.justificatif_motif_refus is null then
    v_titre := 'Justificatif refusé';
  else
    return new;
  end if;

  insert into public.notifications (destinataire_id, etablissement_id, type, titre, lien)
  select p.id, v_etablissement, 'vie_scolaire', v_titre,
    case when p.id = new.eleve_id then '/eleve/vie-scolaire'
         else '/parent/vie-scolaire?enfant=' || new.eleve_id end
  from public.profiles p
  where p.etablissement_id = v_etablissement and p.actif
    and (p.id = new.eleve_id or (
      p.role = 'parent' and exists (
        select 1 from public.liens_parents_eleves l
        where l.eleve_id = new.eleve_id and l.parent_id = p.id
      )
    ));
  return new;
end;
$$;

create trigger notifier_justificatif_vie_scolaire
after update of justificatif_chemin, justificatif_motif_refus, justifie on public.vie_scolaire_evenements
for each row
when (new.type in ('absence', 'retard') and new.justificatif_chemin is not null)
execute function public.notifier_justificatif_vie_scolaire();

revoke execute on function public.notifier_justificatif_vie_scolaire() from public, anon, authenticated;

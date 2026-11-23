alter table public.vie_scolaire_evenements
  add column justificatif_motif_refus text,
  add constraint vie_scolaire_refus_justificatif_valide check (
    justificatif_motif_refus is null or (
      justificatif_chemin is not null and not justifie
      and type in ('absence', 'retard') and btrim(justificatif_motif_refus) <> ''
    )
  );

-- Une famille peut remplacer une pièce refusée. Le dépôt ne change jamais
-- la justification de l'événement et ne remplace pas une pièce en attente.
create or replace function public.ajouter_justificatif_absence(p_vie_scolaire_id uuid, p_chemin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_utilisateur uuid := auth.uid();
begin
  update public.vie_scolaire_evenements v
  set justificatif_chemin = p_chemin, justificatif_motif_refus = null
  where v.id = p_vie_scolaire_id
    and v_utilisateur is not null
    and (v.eleve_id = v_utilisateur or exists (
      select 1 from public.liens_parents_eleves l
      where l.parent_id = v_utilisateur and l.eleve_id = v.eleve_id
    ))
    and v.type in ('absence', 'retard')
    and not v.justifie
    and (v.justificatif_chemin is null or v.justificatif_motif_refus is not null)
    and v.justificatif_chemin is distinct from p_chemin
    and split_part(p_chemin, '/', 1) = v.id::text
    and exists (
      select 1 from storage.objects o
      where o.bucket_id = 'vie-scolaire-justificatifs' and o.name = p_chemin
        and o.owner_id = v_utilisateur::text
    );
  if not found then
    raise exception 'Ce justificatif ne peut pas être joint à cet événement.';
  end if;
end;
$$;

revoke execute on function public.ajouter_justificatif_absence(uuid, text) from public, anon;
grant execute on function public.ajouter_justificatif_absence(uuid, text) to authenticated;

update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'vie-scolaire-justificatifs';

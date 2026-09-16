-- Justificatif d'absence en pièce jointe (jusqu'ici un simple champ texte
-- "motif") : bucket privé dédié, chemin {vie_scolaire_evenement_id}/{uuid}-
-- {nom}, même pattern que ressources-pedagogiques et messagerie-pieces-
-- jointes. L'écriture de la colonne passe par une RPC plutôt que par une
-- policy UPDATE sur la table (qui aurait dû être restreinte colonne par
-- colonne pour empêcher un élève/parent de modifier le motif, le type ou
-- la date) — cohérent avec le pattern déjà utilisé pour soumettre_releve/
-- valider_releve/envoyer_message dans ce projet.

alter table public.vie_scolaire_evenements add column justificatif_chemin text;

insert into storage.buckets (id, name, public)
values ('vie-scolaire-justificatifs', 'vie-scolaire-justificatifs', false)
on conflict (id) do nothing;

create policy vie_scolaire_justificatifs_insert on storage.objects
  for insert
  with check (
    bucket_id = 'vie-scolaire-justificatifs'
    and exists (
      select 1 from vie_scolaire_evenements v
      where v.id = (storage.foldername(objects.name))[1]::uuid
        and (
          v.eleve_id = auth.uid()
          or exists (
            select 1 from liens_parents_eleves lpe
            where lpe.eleve_id = v.eleve_id and lpe.parent_id = auth.uid()
          )
        )
    )
  );

create policy vie_scolaire_justificatifs_select on storage.objects
  for select
  using (
    bucket_id = 'vie-scolaire-justificatifs'
    and exists (
      select 1 from vie_scolaire_evenements v
      where v.id = (storage.foldername(objects.name))[1]::uuid
        and (
          v.eleve_id = auth.uid()
          or exists (
            select 1 from liens_parents_eleves lpe
            where lpe.eleve_id = v.eleve_id and lpe.parent_id = auth.uid()
          )
          or professeur_a_acces_classe(v.classe_id)
          or (current_profile_role() = 'direction' and classe_etablissement_id(v.classe_id) = current_etablissement_id())
        )
    )
  );

create or replace function public.ajouter_justificatif_absence(p_vie_scolaire_id uuid, p_chemin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eleve_id uuid;
begin
  select eleve_id into v_eleve_id from vie_scolaire_evenements where id = p_vie_scolaire_id;
  if v_eleve_id is null then
    raise exception 'Événement de vie scolaire introuvable';
  end if;
  if v_eleve_id <> auth.uid()
     and not exists (
       select 1 from liens_parents_eleves
       where parent_id = auth.uid() and eleve_id = v_eleve_id
     ) then
    raise exception 'Non autorisé à modifier cet événement';
  end if;
  update vie_scolaire_evenements set justificatif_chemin = p_chemin where id = p_vie_scolaire_id;
end;
$$;

revoke execute on function public.ajouter_justificatif_absence(uuid, text) from public, anon;
grant execute on function public.ajouter_justificatif_absence(uuid, text) to authenticated;

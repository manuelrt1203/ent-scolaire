-- Pièces jointes sur la messagerie interne (absentes en v1, voir migration
-- 0009_messaging.sql). Même pattern que ressources_pedagogiques : bucket de
-- stockage privé, policies RLS sur storage.objects basées sur le premier
-- segment du chemin (ici l'id du message), URL signée temporaire pour le
-- téléchargement côté client.

insert into storage.buckets (id, name, public)
values ('messagerie-pieces-jointes', 'messagerie-pieces-jointes', false)
on conflict (id) do nothing;

create table message_pieces_jointes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  nom_fichier text not null,
  chemin_fichier text not null,
  type_mime text,
  taille_octets integer,
  created_at timestamptz not null default now()
);

create index idx_message_pieces_jointes_message_id on message_pieces_jointes(message_id);

alter table message_pieces_jointes enable row level security;

create policy pieces_jointes_select on message_pieces_jointes for select
  using (
    exists (select 1 from messages m where m.id = message_pieces_jointes.message_id and m.expediteur_id = (select auth.uid()))
    or est_destinataire_message(message_id)
  );

create policy pieces_jointes_insert on message_pieces_jointes for insert
  with check (
    exists (select 1 from messages m where m.id = message_pieces_jointes.message_id and m.expediteur_id = (select auth.uid()))
  );

-- storage.objects : le chemin est structuré "<message_id>/<uuid>-<nom>",
-- storage.foldername(name)[1] extrait ce premier segment (l'id du message).
create policy messagerie_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'messagerie-pieces-jointes'
    and exists (
      select 1 from messages m
      where m.id = (storage.foldername(name))[1]::uuid
        and m.expediteur_id = (select auth.uid())
    )
  );

create policy messagerie_storage_select on storage.objects for select
  using (
    bucket_id = 'messagerie-pieces-jointes'
    and (
      exists (
        select 1 from messages m
        where m.id = (storage.foldername(name))[1]::uuid
          and m.expediteur_id = (select auth.uid())
      )
      or est_destinataire_message(((storage.foldername(name))[1])::uuid)
    )
  );

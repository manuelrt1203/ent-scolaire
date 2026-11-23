-- Permet à l'expéditeur de masquer un message de sa liste "Envoyés"
-- (n'affecte pas la visibilité côté destinataires). Pas de policy UPDATE
-- directe sur messages (ça permettrait de modifier sujet/corps après coup) :
-- une fonction dédiée qui ne touche que ce flag est la vraie frontière.
alter table messages add column supprime_expediteur boolean not null default false;

create function supprimer_message_envoye(p_message_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
begin
  update messages set supprime_expediteur = true
    where id = p_message_id and expediteur_id = auth.uid();
  if not found then
    raise exception 'Message introuvable ou vous n''en êtes pas l''expéditeur';
  end if;
end;
$$;

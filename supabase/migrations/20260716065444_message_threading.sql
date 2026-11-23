-- Fil de discussion : une réponse pointe vers la RACINE du fil (jamais vers
-- un message intermédiaire), ce qui évite les arbres imbriqués et permet de
-- récupérer un fil entier avec une seule requête plate.
alter table messages add column parent_message_id uuid references messages(id) on delete set null;
create index idx_messages_parent on messages(parent_message_id);

create or replace function envoyer_message(
  p_sujet text,
  p_corps text,
  p_destinataires uuid[],
  p_parent_message_id uuid default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_message_id uuid;
  v_dest uuid;
  v_root_id uuid;
begin
  if p_destinataires is null or array_length(p_destinataires, 1) is null or array_length(p_destinataires, 1) = 0 then
    raise exception 'Au moins un destinataire est requis';
  end if;
  if p_sujet is null or length(trim(p_sujet)) = 0 then
    raise exception 'Le sujet est requis';
  end if;

  v_root_id := null;
  if p_parent_message_id is not null then
    -- Résout vers la racine du fil (pas de threads imbriqués) et vérifie que
    -- l'appelant fait bien partie de ce message (expéditeur ou destinataire).
    select coalesce(parent_message_id, id) into v_root_id from messages where id = p_parent_message_id;
    if v_root_id is null then
      raise exception 'Message parent introuvable';
    end if;
    if not (
      exists (select 1 from messages m where m.id = p_parent_message_id and m.expediteur_id = auth.uid())
      or est_destinataire_message(p_parent_message_id)
    ) then
      raise exception 'Vous ne faites pas partie de ce fil de discussion';
    end if;
  end if;

  insert into messages (expediteur_id, sujet, corps, parent_message_id)
    values (auth.uid(), p_sujet, p_corps, v_root_id) returning id into v_message_id;

  foreach v_dest in array p_destinataires loop
    if profile_etablissement_id(v_dest) is distinct from current_etablissement_id() then
      raise exception 'Destinataire hors établissement';
    end if;
    insert into message_destinataires (message_id, destinataire_id) values (v_message_id, v_dest);
  end loop;

  return v_message_id;
end;
$$;

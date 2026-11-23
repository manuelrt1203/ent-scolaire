create table messages (
  id uuid primary key default gen_random_uuid(),
  expediteur_id uuid not null references profiles(id) on delete cascade,
  sujet text not null,
  corps text not null,
  created_at timestamptz not null default now()
);

create table message_destinataires (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  destinataire_id uuid not null references profiles(id) on delete cascade,
  lu boolean not null default false,
  lu_le timestamptz,
  supprime boolean not null default false,
  unique (message_id, destinataire_id)
);

create index idx_messages_expediteur on messages(expediteur_id);
create index idx_destinataires_message on message_destinataires(message_id);
create index idx_destinataires_destinataire on message_destinataires(destinataire_id);

alter table messages enable row level security;
alter table message_destinataires enable row level security;

create function est_destinataire_message(p_message_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from message_destinataires where message_id = p_message_id and destinataire_id = auth.uid())
$$;

create function profile_etablissement_id(p_user_id uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select etablissement_id from profiles where id = p_user_id
$$;

create policy messages_select on messages for select
  using (expediteur_id = auth.uid() or est_destinataire_message(id));

create policy messages_insert on messages for insert
  with check (expediteur_id = auth.uid());

create policy destinataires_select on message_destinataires for select
  using (
    destinataire_id = auth.uid()
    or exists (select 1 from messages m where m.id = message_destinataires.message_id and m.expediteur_id = auth.uid())
  );

create policy destinataires_insert on message_destinataires for insert
  with check (
    exists (select 1 from messages m where m.id = message_destinataires.message_id and m.expediteur_id = auth.uid())
    and profile_etablissement_id(message_destinataires.destinataire_id) = current_etablissement_id()
  );

create policy destinataires_update on message_destinataires for update
  using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());

create function envoyer_message(p_sujet text, p_corps text, p_destinataires uuid[]) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_message_id uuid;
  v_dest uuid;
begin
  if p_destinataires is null or array_length(p_destinataires, 1) is null or array_length(p_destinataires, 1) = 0 then
    raise exception 'Au moins un destinataire est requis';
  end if;
  if p_sujet is null or length(trim(p_sujet)) = 0 then
    raise exception 'Le sujet est requis';
  end if;

  insert into messages (expediteur_id, sujet, corps) values (auth.uid(), p_sujet, p_corps) returning id into v_message_id;

  foreach v_dest in array p_destinataires loop
    if profile_etablissement_id(v_dest) is distinct from current_etablissement_id() then
      raise exception 'Destinataire hors établissement';
    end if;
    insert into message_destinataires (message_id, destinataire_id) values (v_message_id, v_dest);
  end loop;

  return v_message_id;
end;
$$;

-- Table de notifications : alimente le tableau de bord (accueil élève/parent/
-- professeur/direction) avec les événements pertinents, plutôt que de laisser
-- l'utilisateur découvrir une note publiée, un devoir ou une actualité en
-- naviguant au hasard. Écriture uniquement via les fonctions SECURITY DEFINER
-- ci-dessous (déclenchées par trigger), jamais directement par les clients.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  destinataire_id uuid not null references public.profiles(id) on delete cascade,
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  type text not null check (type in ('note_publiee','actualite','cahier_texte','vie_scolaire')),
  titre text not null,
  contenu text,
  lien text,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_destinataire_idx on public.notifications (destinataire_id, lu, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (destinataire_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());

-- 1. Relevé publié -> notifie l'élève de la classe concernée + ses parents.
create or replace function public.notifier_releve_publie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classe_id uuid;
  v_etablissement_id uuid;
  v_matiere_nom text;
  v_periode_nom text;
begin
  if new.statut = 'publiee' and old.statut is distinct from 'publiee' then
    select mc.classe_id, cl.etablissement_id, m.nom
      into v_classe_id, v_etablissement_id, v_matiere_nom
      from matiere_classe mc
      join classes cl on cl.id = mc.classe_id
      join matieres m on m.id = mc.matiere_id
      where mc.id = new.matiere_classe_id;

    select nom into v_periode_nom from periodes where id = new.periode_id;

    insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
    select i.eleve_id, v_etablissement_id, 'note_publiee',
           'Notes publiées — ' || v_matiere_nom,
           'Vos notes de ' || v_matiere_nom || ' pour ' || coalesce(v_periode_nom, 'la période') || ' sont publiées.',
           '/eleve/notes'
      from inscriptions i
      where i.classe_id = v_classe_id;

    insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
    select lpe.parent_id, v_etablissement_id, 'note_publiee',
           'Notes publiées — ' || v_matiere_nom,
           'Les notes de ' || v_matiere_nom || ' pour ' || coalesce(v_periode_nom, 'la période') || ' sont publiées.',
           '/parent/notes'
      from inscriptions i
      join liens_parents_eleves lpe on lpe.eleve_id = i.eleve_id
      where i.classe_id = v_classe_id;
  end if;
  return new;
end;
$$;

create trigger trg_notifier_releve_publie
  after update on releves_notes
  for each row execute function notifier_releve_publie();

-- 2. Nouvelle actualité -> notifie les profils de l'établissement ciblés par
-- le champ "cible" (ou tout le monde si cible est null), sauf l'auteur.
create or replace function public.notifier_actualite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select p.id, new.etablissement_id, 'actualite', 'Actualité — ' || new.titre,
         left(new.contenu, 140),
         case p.role
           when 'direction' then '/direction/actualites'
           when 'professeur' then '/professeur/actualites'
           when 'eleve' then '/eleve/actualites'
           when 'parent' then '/parent/actualites'
         end
    from profiles p
    where p.etablissement_id = new.etablissement_id
      and p.id is distinct from new.auteur_id
      and (new.cible is null or p.role = new.cible);
  return new;
end;
$$;

create trigger trg_notifier_actualite
  after insert on actualites
  for each row execute function notifier_actualite();

-- 3. Nouvelle entrée de cahier de textes -> notifie les élèves de la classe
-- concernée + leurs parents.
create or replace function public.notifier_cahier_texte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classe_id uuid;
  v_etablissement_id uuid;
  v_matiere_nom text;
begin
  select mc.classe_id, cl.etablissement_id, m.nom
    into v_classe_id, v_etablissement_id, v_matiere_nom
    from matiere_classe mc
    join classes cl on cl.id = mc.classe_id
    join matieres m on m.id = mc.matiere_id
    where mc.id = new.matiere_classe_id;

  insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select i.eleve_id, v_etablissement_id, 'cahier_texte',
         'Cahier de textes — ' || v_matiere_nom,
         coalesce(new.travail_a_faire, new.contenu_seance, ''),
         '/eleve/cahier-textes'
    from inscriptions i
    where i.classe_id = v_classe_id;

  insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select lpe.parent_id, v_etablissement_id, 'cahier_texte',
         'Cahier de textes — ' || v_matiere_nom,
         coalesce(new.travail_a_faire, new.contenu_seance, ''),
         '/parent/cahier-textes'
    from inscriptions i
    join liens_parents_eleves lpe on lpe.eleve_id = i.eleve_id
    where i.classe_id = v_classe_id;

  return new;
end;
$$;

create trigger trg_notifier_cahier_texte
  after insert on cahier_texte
  for each row execute function notifier_cahier_texte();

-- 4. Nouvel événement de vie scolaire -> notifie l'élève concerné + ses parents.
create or replace function public.notifier_vie_scolaire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etablissement_id uuid;
  v_type_label text;
begin
  select etablissement_id into v_etablissement_id from classes where id = new.classe_id;

  v_type_label := case new.type
    when 'absence' then 'Absence'
    when 'retard' then 'Retard'
    when 'sanction' then 'Sanction'
    else new.type
  end;

  insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  values (new.eleve_id, v_etablissement_id, 'vie_scolaire', v_type_label, coalesce(new.motif, new.description, ''), '/eleve/vie-scolaire');

  insert into notifications (destinataire_id, etablissement_id, type, titre, contenu, lien)
  select lpe.parent_id, v_etablissement_id, 'vie_scolaire', v_type_label, coalesce(new.motif, new.description, ''), '/parent/vie-scolaire'
    from liens_parents_eleves lpe
    where lpe.eleve_id = new.eleve_id;

  return new;
end;
$$;

create trigger trg_notifier_vie_scolaire
  after insert on vie_scolaire_evenements
  for each row execute function notifier_vie_scolaire();

-- Ces fonctions ne doivent jamais être appelées directement en RPC (seulement
-- par les triggers ci-dessus) ; Postgres refuse déjà l'appel direct d'une
-- fonction de retour "trigger" hors contexte de trigger, mais on retire aussi
-- explicitement le droit d'exécution pour que ce soit sans ambiguïté.
revoke execute on function public.notifier_releve_publie() from public, anon, authenticated;
revoke execute on function public.notifier_actualite() from public, anon, authenticated;
revoke execute on function public.notifier_cahier_texte() from public, anon, authenticated;
revoke execute on function public.notifier_vie_scolaire() from public, anon, authenticated;

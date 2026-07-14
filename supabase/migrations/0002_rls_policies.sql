-- Row Level Security : la vraie frontière de sécurité, car les deux clients
-- (Electron et mobile) embarquent la clé anonyme publique.

-- Fonctions SECURITY DEFINER pour éviter la récursion RLS sur profiles.
create function current_profile_role() returns role_utilisateur
  language sql stable security definer set search_path = public as
  $$ select role from profiles where id = auth.uid() $$;

create function current_etablissement_id() returns uuid
  language sql stable security definer set search_path = public as
  $$ select etablissement_id from profiles where id = auth.uid() $$;

alter table etablissements enable row level security;
alter table annees_scolaires enable row level security;
alter table periodes enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table matieres enable row level security;
alter table matiere_classe enable row level security;
alter table affectations enable row level security;
alter table inscriptions enable row level security;
alter table liens_parents_eleves enable row level security;
alter table releves_notes enable row level security;
alter table notes enable row level security;
alter table historique_releves enable row level security;

-- Tables de référence : lecture par tout membre de l'établissement, écriture réservée à la direction.
create policy etablissements_select on etablissements for select
  using (id = current_etablissement_id());
create policy etablissements_write on etablissements for all
  using (current_profile_role() = 'direction' and id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and id = current_etablissement_id());

create policy annees_select on annees_scolaires for select
  using (etablissement_id = current_etablissement_id());
create policy annees_write on annees_scolaires for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());

create policy periodes_select on periodes for select
  using (exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = current_etablissement_id()));
create policy periodes_write on periodes for all
  using (current_profile_role() = 'direction' and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = current_etablissement_id()))
  with check (current_profile_role() = 'direction' and exists (select 1 from annees_scolaires a where a.id = periodes.annee_scolaire_id and a.etablissement_id = current_etablissement_id()));

create policy matieres_select on matieres for select
  using (etablissement_id = current_etablissement_id());
create policy matieres_write on matieres for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());

-- profiles : chacun voit son propre profil ; direction voit tout son établissement ;
-- profs voient les élèves de leurs classes affectées ; parents voient leurs enfants liés.
create policy profiles_select_self on profiles for select
  using (id = auth.uid());
create policy profiles_select_direction on profiles for select
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());
create policy profiles_select_professeur on profiles for select
  using (
    current_profile_role() = 'professeur'
    and exists (
      select 1 from inscriptions i
      join affectations a on a.matiere_classe_id in (
        select mc.id from matiere_classe mc where mc.classe_id = i.classe_id
      )
      where i.eleve_id = profiles.id and a.professeur_id = auth.uid()
    )
  );
create policy profiles_select_parent on profiles for select
  using (
    current_profile_role() = 'parent'
    and exists (select 1 from liens_parents_eleves l where l.parent_id = auth.uid() and l.eleve_id = profiles.id)
  );
create policy profiles_update_self on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles p where p.id = auth.uid()));
create policy profiles_write_direction on profiles for update
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());
-- Pas d'INSERT client sur profiles : uniquement via l'edge function admin-create-user (service role).

create policy classes_select on classes for select
  using (
    etablissement_id = current_etablissement_id()
    and (
      current_profile_role() in ('direction')
      or exists (select 1 from affectations a join matiere_classe mc on mc.id = a.matiere_classe_id where mc.classe_id = classes.id and a.professeur_id = auth.uid())
      or exists (select 1 from inscriptions i where i.classe_id = classes.id and i.eleve_id = auth.uid())
      or exists (select 1 from inscriptions i join liens_parents_eleves l on l.eleve_id = i.eleve_id where i.classe_id = classes.id and l.parent_id = auth.uid())
    )
  );
create policy classes_write on classes for all
  using (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id())
  with check (current_profile_role() = 'direction' and etablissement_id = current_etablissement_id());

create policy matiere_classe_select on matiere_classe for select
  using (
    exists (select 1 from classes c where c.id = matiere_classe.classe_id and c.etablissement_id = current_etablissement_id())
  );
create policy matiere_classe_write on matiere_classe for all
  using (current_profile_role() = 'direction')
  with check (current_profile_role() = 'direction');

create policy affectations_select on affectations for select
  using (
    professeur_id = auth.uid()
    or current_profile_role() = 'direction'
  );
create policy affectations_write on affectations for all
  using (current_profile_role() = 'direction')
  with check (current_profile_role() = 'direction');

create policy inscriptions_select on inscriptions for select
  using (
    eleve_id = auth.uid()
    or current_profile_role() = 'direction'
    or exists (select 1 from liens_parents_eleves l where l.eleve_id = inscriptions.eleve_id and l.parent_id = auth.uid())
    or exists (select 1 from affectations a join matiere_classe mc on mc.id = a.matiere_classe_id where mc.classe_id = inscriptions.classe_id and a.professeur_id = auth.uid())
  );
create policy inscriptions_write on inscriptions for all
  using (current_profile_role() = 'direction')
  with check (current_profile_role() = 'direction');

create policy liens_select on liens_parents_eleves for select
  using (parent_id = auth.uid() or eleve_id = auth.uid() or current_profile_role() = 'direction');
create policy liens_write on liens_parents_eleves for all
  using (current_profile_role() = 'direction')
  with check (current_profile_role() = 'direction');

-- releves_notes : le cœur du workflow.
create policy releves_select_direction on releves_notes for select
  using (
    current_profile_role() = 'direction'
    and exists (select 1 from matiere_classe mc join classes c on c.id = mc.classe_id where mc.id = releves_notes.matiere_classe_id and c.etablissement_id = current_etablissement_id())
  );
create policy releves_select_professeur on releves_notes for select
  using (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = auth.uid()));

create policy releves_insert_professeur on releves_notes for insert
  with check (exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = auth.uid()));

create policy releves_update_professeur on releves_notes for update
  using (
    exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = auth.uid())
    and statut = 'brouillon'
  )
  with check (
    exists (select 1 from affectations a where a.matiere_classe_id = releves_notes.matiere_classe_id and a.professeur_id = auth.uid())
    and statut in ('brouillon', 'soumise')
  );

create policy releves_update_direction on releves_notes for update
  using (
    current_profile_role() = 'direction'
    and statut in ('soumise', 'validee')
    and exists (select 1 from matiere_classe mc join classes c on c.id = mc.classe_id where mc.id = releves_notes.matiere_classe_id and c.etablissement_id = current_etablissement_id())
  )
  with check (
    current_profile_role() = 'direction'
    and statut in ('validee', 'publiee', 'brouillon')
  );

-- notes : suit le statut du relevé parent.
create policy notes_select_professeur on notes for select
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = auth.uid()));
create policy notes_select_direction on notes for select
  using (
    current_profile_role() = 'direction'
    and exists (select 1 from releves_notes r join matiere_classe mc on mc.id = r.matiere_classe_id join classes c on c.id = mc.classe_id where r.id = notes.releve_id and c.etablissement_id = current_etablissement_id())
  );
create policy notes_select_eleve on notes for select
  using (eleve_id = auth.uid() and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'publiee'));
create policy notes_select_parent on notes for select
  using (
    exists (select 1 from liens_parents_eleves l where l.parent_id = auth.uid() and l.eleve_id = notes.eleve_id)
    and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'publiee')
  );

create policy notes_insert_professeur on notes for insert
  with check (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = auth.uid() and r.statut = 'brouillon'));

create policy notes_update_professeur on notes for update
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = auth.uid() and r.statut = 'brouillon'))
  with check (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = auth.uid() and r.statut = 'brouillon'));

create policy notes_update_direction on notes for update
  using (
    current_profile_role() = 'direction'
    and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'soumise')
  )
  with check (
    current_profile_role() = 'direction'
    and exists (select 1 from releves_notes r where r.id = notes.releve_id and r.statut = 'soumise')
  );

create policy notes_delete_professeur on notes for delete
  using (exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = notes.releve_id and a.professeur_id = auth.uid() and r.statut = 'brouillon'));

-- historique_releves : aucune écriture cliente (uniquement via les fonctions RPC, security definer).
create policy historique_select on historique_releves for select
  using (
    exists (select 1 from releves_notes r join affectations a on a.matiere_classe_id = r.matiere_classe_id where r.id = historique_releves.releve_id and a.professeur_id = auth.uid())
    or (current_profile_role() = 'direction' and exists (select 1 from releves_notes r join matiere_classe mc on mc.id = r.matiere_classe_id join classes c on c.id = mc.classe_id where r.id = historique_releves.releve_id and c.etablissement_id = current_etablissement_id()))
  );

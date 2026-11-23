-- Jeu de données de test appliqué directement sur le projet Supabase distant
-- via execute_sql (voir historique). Reproductible en local avec `supabase db reset`
-- si un environnement Supabase local est mis en place plus tard.
--
-- Comptes de test créés (mot de passe commun : Test1234!) :
--   direction@ecole-test.fr  (direction)
--   prof@ecole-test.fr       (professeur, affecté à Terminale A : Maths + Français)
--   eleve1@ecole-test.fr     (élève, Terminale A)
--   eleve2@ecole-test.fr     (élève, Terminale A)
--   parent@ecole-test.fr     (parent, lié à eleve1)
--
-- Structure : Lycée Test, année 2025-2026, 3 trimestres, 2 classes
-- (Terminale A, Première B), 2 matières (Mathématiques coeff 4, Français coeff 2)
-- rattachées à Terminale A.

do $$
declare
  v_etab uuid;
  v_annee uuid;
  v_t1 uuid; v_t2 uuid; v_t3 uuid;
  v_classe1 uuid; v_classe2 uuid;
  v_maths uuid; v_francais uuid;
  v_mc1 uuid; v_mc2 uuid;
  v_direction uuid := gen_random_uuid();
  v_prof uuid := gen_random_uuid();
  v_eleve1 uuid := gen_random_uuid();
  v_eleve2 uuid := gen_random_uuid();
  v_parent uuid := gen_random_uuid();
  v_pass text := crypt('Test1234!', gen_salt('bf'));
begin
  insert into etablissements (id, nom, adresse) values (gen_random_uuid(), 'Lycée Test', '1 rue de l''École') returning id into v_etab;
  insert into annees_scolaires (id, etablissement_id, libelle, date_debut, date_fin, est_active)
    values (gen_random_uuid(), v_etab, '2025-2026', '2025-09-01', '2026-07-01', true) returning id into v_annee;
  insert into periodes (id, annee_scolaire_id, nom, ordre, date_debut, date_fin) values
    (gen_random_uuid(), v_annee, 'Trimestre 1', 1, '2025-09-01', '2025-12-19') returning id into v_t1;
  insert into periodes (id, annee_scolaire_id, nom, ordre, date_debut, date_fin) values
    (gen_random_uuid(), v_annee, 'Trimestre 2', 2, '2026-01-05', '2026-03-27') returning id into v_t2;
  insert into periodes (id, annee_scolaire_id, nom, ordre, date_debut, date_fin) values
    (gen_random_uuid(), v_annee, 'Trimestre 3', 3, '2026-04-13', '2026-07-01') returning id into v_t3;

  insert into classes (id, etablissement_id, annee_scolaire_id, nom, niveau, cycle) values
    (gen_random_uuid(), v_etab, v_annee, 'Terminale A', 'Terminale', 'lycee') returning id into v_classe1;
  insert into classes (id, etablissement_id, annee_scolaire_id, nom, niveau, cycle) values
    (gen_random_uuid(), v_etab, v_annee, 'Première B', 'Première', 'lycee') returning id into v_classe2;

  insert into matieres (id, etablissement_id, nom, code) values (gen_random_uuid(), v_etab, 'Mathématiques', 'MATH') returning id into v_maths;
  insert into matieres (id, etablissement_id, nom, code) values (gen_random_uuid(), v_etab, 'Français', 'FR') returning id into v_francais;

  insert into matiere_classe (id, classe_id, matiere_id, annee_scolaire_id, coefficient) values
    (gen_random_uuid(), v_classe1, v_maths, v_annee, 4) returning id into v_mc1;
  insert into matiere_classe (id, classe_id, matiere_id, annee_scolaire_id, coefficient) values
    (gen_random_uuid(), v_classe1, v_francais, v_annee, 2) returning id into v_mc2;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    ('00000000-0000-0000-0000-000000000000', v_direction, 'authenticated', 'authenticated', 'direction@ecole-test.fr', v_pass, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_prof, 'authenticated', 'authenticated', 'prof@ecole-test.fr', v_pass, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_eleve1, 'authenticated', 'authenticated', 'eleve1@ecole-test.fr', v_pass, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_eleve2, 'authenticated', 'authenticated', 'eleve2@ecole-test.fr', v_pass, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_parent, 'authenticated', 'authenticated', 'parent@ecole-test.fr', v_pass, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_direction, v_direction::text, jsonb_build_object('sub', v_direction::text, 'email', 'direction@ecole-test.fr'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_prof, v_prof::text, jsonb_build_object('sub', v_prof::text, 'email', 'prof@ecole-test.fr'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_eleve1, v_eleve1::text, jsonb_build_object('sub', v_eleve1::text, 'email', 'eleve1@ecole-test.fr'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_eleve2, v_eleve2::text, jsonb_build_object('sub', v_eleve2::text, 'email', 'eleve2@ecole-test.fr'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_parent, v_parent::text, jsonb_build_object('sub', v_parent::text, 'email', 'parent@ecole-test.fr'), 'email', now(), now(), now());

  insert into profiles (id, etablissement_id, role, nom, prenom, email) values
    (v_direction, v_etab, 'direction', 'Dupont', 'Alice', 'direction@ecole-test.fr'),
    (v_prof, v_etab, 'professeur', 'Martin', 'Bruno', 'prof@ecole-test.fr'),
    (v_eleve1, v_etab, 'eleve', 'Durand', 'Chloé', 'eleve1@ecole-test.fr'),
    (v_eleve2, v_etab, 'eleve', 'Petit', 'David', 'eleve2@ecole-test.fr'),
    (v_parent, v_etab, 'parent', 'Durand', 'Eric', 'parent@ecole-test.fr');

  insert into affectations (professeur_id, matiere_classe_id) values (v_prof, v_mc1), (v_prof, v_mc2);
  insert into inscriptions (eleve_id, classe_id, annee_scolaire_id) values
    (v_eleve1, v_classe1, v_annee), (v_eleve2, v_classe1, v_annee);
  insert into liens_parents_eleves (parent_id, eleve_id) values (v_parent, v_eleve1);
end $$;

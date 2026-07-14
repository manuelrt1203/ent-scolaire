# ENT Scolaire

Logiciel de gestion scolaire reliant direction, professeurs, élèves et parents
autour du cycle de vie des notes : saisie par le professeur → soumission →
validation/correction par la direction → calcul de la moyenne → publication
aux élèves et parents.

La messagerie interne (v2) est hors périmètre de cette première version.

## Architecture

- **Backend** : Supabase (Postgres + Auth + Row Level Security). Projet
  `ent-scolaire`, région `eu-west-1`.
- **`packages/shared`** : client Supabase, types générés, fonctions API,
  hooks `@tanstack/react-query` — partagés entre les futurs clients desktop
  et mobile.
- **`apps/desktop`** : application Electron (React + Tailwind v4) pour la
  direction et les professeurs.
- **`supabase/`** : migrations SQL (schéma, RLS, fonctions RPC du cycle de
  vie des notes, moyennes), edge function `admin-create-user`.

## Démarrage

```bash
npm install
npm run desktop   # lance l'app Electron en dev
```

Les variables d'environnement Supabase sont dans `apps/desktop/.env`
(voir `.env.example` à la racine pour les valeurs).

## Comptes de test (mot de passe : `Test1234!`)

| Rôle | Email |
|---|---|
| Direction | direction@ecole-test.fr |
| Professeur | prof@ecole-test.fr (Maths + Français, Terminale A) |
| Élève | eleve1@ecole-test.fr |
| Élève | eleve2@ecole-test.fr |
| Parent | parent@ecole-test.fr (lié à eleve1) |

Voir `supabase/seed.sql` pour le détail des données de référence
(établissement, année scolaire, classes, matières).

## Vérification du cycle de notes

```bash
npm run test:workflow
```

Exerce le cycle complet (saisie → soumission → validation → publication)
contre le projet Supabase réel, avec des vérifications RLS négatives
(un professeur ne peut pas modifier une note soumise, un parent ne voit pas
les notes d'un autre enfant, etc.).

## État d'avancement

- [x] M0 — Schéma Supabase (tables, RLS, fonctions RPC, moyennes)
- [x] M1 — Package partagé + authentification
- [x] M2 — Écrans admin direction (classes, matières, affectations, comptes)
- [x] M3 — Saisie et soumission des notes (professeur)
- [x] M4 — Validation, moyenne, publication (direction)
- [ ] M5 — Application mobile (Expo) : consultation élève/parent
- [ ] M6 — Packaging (electron-builder, EAS)
- [ ] v2 — Messagerie interne

## Notes de sécurité

Row Level Security est la véritable frontière de sécurité : les deux clients
embarquent la clé anonyme publique. Plusieurs fonctions `SECURITY DEFINER`
(`current_profile_role`, `professeur_a_acces_classe`, etc.) contournent RLS
sur des sous-requêtes internes pour éviter les récursions de policies —
c'est un piège classique sur ce genre de modèle relationnel imbriqué,
rencontré et corrigé pendant le développement (voir migrations `0005` et
`0008`).

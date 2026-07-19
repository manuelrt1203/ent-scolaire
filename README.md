# ENT Scolaire

Logiciel de gestion scolaire reliant direction, professeurs, élèves et parents
autour du cycle de vie des notes : saisie par le professeur → soumission →
validation/correction par la direction → calcul de la moyenne → publication
aux élèves et parents. Inclut aussi une messagerie interne type webmail,
ouverte entre tous les rôles.

## Architecture

- **Backend** : Supabase (Postgres + Auth + Row Level Security). Projet
  `ent-scolaire`, région `eu-west-1`.
- **`packages/shared`** : client Supabase, types générés, fonctions API,
  hooks `@tanstack/react-query` — partagés entre les clients desktop et
  mobile (aucune logique métier dupliquée entre les deux).
- **`apps/desktop`** : application Electron (React + Tailwind v4) pour la
  direction et les professeurs.
- **`apps/mobile`** : application Expo/React Native (expo-router +
  NativeWind) pour les élèves et parents — consultation des notes et
  messagerie.
- **`supabase/`** : migrations SQL (schéma, RLS, fonctions RPC du cycle de
  vie des notes, moyennes, messagerie), edge function `admin-create-user`.

## Démarrage

```bash
npm install
npm run desktop        # lance l'app Electron en dev (direction/professeur)
cd apps/mobile && npx expo start   # lance l'app mobile en dev (élève/parent), scanner le QR code avec Expo Go
```

Les variables d'environnement Supabase sont dans `apps/desktop/.env` et
`apps/mobile/.env` (voir `.env.example` à la racine pour les valeurs).

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
- [x] Messagerie interne (desktop + mobile), ouverte entre tous les rôles
- [x] M5 — Application mobile (Expo) : consultation élève/parent + messagerie
- [x] M6 — Packaging desktop (electron-builder, Linux AppImage + .deb)
- [x] M6 — Packaging mobile (EAS Build, projet lié : `@manuel1203/ent-scolaire-mobile`)

## Packaging

### Desktop (Linux)

```bash
cd apps/desktop
npm run package   # produit release/ENT Scolaire-<version>-x86_64.AppImage et .deb
```

### Mobile (EAS Build)

Nécessite un compte sur [expo.dev](https://expo.dev) (gratuit) :

```bash
cd apps/mobile
npx eas login              # une fois, ouvre le navigateur pour se connecter
npx eas init                # lie le projet à ton compte Expo (génère un projectId)
npm run build:preview       # build Android APK de test (distribution interne)
npm run build:production    # build Android App Bundle (production, Play Store)
```

Le build tourne sur les serveurs Expo (gratuit avec des limites mensuelles
sur le plan gratuit) — pas besoin d'Android Studio en local. Un lien de
téléchargement de l'APK est fourni à la fin, installable directement sur un
téléphone Android. Un build iOS nécessite en plus un compte Apple
Developer (payant, 99$/an).

## Notes de sécurité

Row Level Security est la véritable frontière de sécurité : les deux clients
embarquent la clé anonyme publique. Plusieurs fonctions `SECURITY DEFINER`
(`current_profile_role`, `professeur_a_acces_classe`, etc.) contournent RLS
sur des sous-requêtes internes pour éviter les récursions de policies —
c'est un piège classique sur ce genre de modèle relationnel imbriqué,
rencontré et corrigé pendant le développement (voir migrations `0005` et
`0008`).

## Mentions légales et confidentialité

Voir [`legal/mentions-legales.md`](legal/mentions-legales.md) et
[`legal/politique-confidentialite.md`](legal/politique-confidentialite.md).
Ce sont des brouillons à faire relire par un professionnel du droit avant
tout déploiement auprès d'un établissement réel (données de mineurs).

## Sauvegardes

Le plan Supabase actuel (gratuit) n'a **aucune sauvegarde automatique**.
Voir [`legal/continuite-activite.md`](legal/continuite-activite.md) et
`npm run db:backup`.

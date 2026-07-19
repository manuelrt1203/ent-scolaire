# Politique de confidentialité — ENT Scolaire

*Dernière mise à jour : 19 juillet 2026*

> **Avertissement** : ce document est un premier brouillon rédigé pour poser une base sérieuse avant tout déploiement réel auprès d'un établissement scolaire. Il traite de données concernant des mineurs, ce qui est un sujet sensible. **Avant toute mise en production auprès d'une vraie école, faites relire ce document par un professionnel du droit** (avocat, ou service juridique de l'établissement partenaire). Ce brouillon s'appuie sur le RGPD et les recommandations générales de la CNIL pour les logiciels de vie scolaire, mais ne constitue pas un conseil juridique.

## 1. Qui fait quoi (responsable de traitement / sous-traitant)

C'est le point le plus important à comprendre avant tout le reste :

- **ENT Scolaire** (l'éditeur du logiciel) est **sous-traitant** au sens du RGPD (article 28) : il fournit l'outil technique, héberge les données, mais n'est pas celui qui décide pourquoi et comment les données des élèves, parents et professeurs sont utilisées.
- **Chaque établissement scolaire** utilisant le logiciel est **responsable de traitement** : c'est l'école qui décide de faire figurer tel élève dans telle classe, qui saisit les notes, qui signale une absence, etc. C'est donc l'établissement qui doit informer ses élèves/familles/personnels et qui répond de la conformité RGPD vis-à-vis d'eux.

En pratique, cela veut dire que **chaque établissement devrait publier sa propre notice d'information** (qui peut reprendre le contenu ci-dessous en l'adaptant), et qu'un **contrat de sous-traitance** (article 28 RGPD) devrait être signé entre l'établissement et l'éditeur du logiciel avant toute utilisation réelle. Ce document sert de base à ces deux usages.

## 2. Éditeur du logiciel

ENT Scolaire est actuellement un projet personnel/étudiant, sans structure juridique formelle.
Contact : **manuelrt1203@gmail.com**

*(À mettre à jour si le projet est formalisé — auto-entreprise, société — voir `mentions-legales.md`.)*

## 3. Données collectées

Le logiciel a été conçu pour ne collecter que ce qui est strictement nécessaire au suivi de la scolarité (principe de minimisation des données). Concrètement :

| Catégorie | Champs | Personnes concernées |
|---|---|---|
| Identité | nom, prénom, adresse email, rôle (direction / professeur / élève / parent) | Tous les utilisateurs du logiciel |
| Scolarité | classe, matières suivies, coefficients | Élèves, professeurs |
| Notes | valeur de la note, matière, période, statut (brouillon/soumise/validée/publiée) | Élèves |
| Vie scolaire | absences, retards, sanctions, motif/justificatif éventuel | Élèves |
| Cahier de textes | contenu des séances, travail à faire | Classes (visible par élèves/parents/profs concernés) |
| Ressources pédagogiques | fichiers déposés par les professeurs | Classes concernées |
| Messagerie interne | sujet, contenu, expéditeur, destinataires | Utilisateurs échangeant entre eux |
| Liens familiaux | rattachement d'un compte parent à un ou plusieurs comptes élèves | Parents, élèves |

**Ce que le logiciel ne collecte pas** : pas de numéro de téléphone, pas d'adresse postale, pas de date de naissance, pas de données de santé (au-delà d'un éventuel motif d'absence saisi manuellement par l'établissement), pas de données de géolocalisation, pas de cookies publicitaires ou de traceurs tiers.

## 4. Pourquoi ces données sont traitées (base légale)

- Pour les établissements publics : **mission d'intérêt public** (article 6.1.e du RGPD) — le suivi de la scolarité fait partie des missions du service public de l'éducation.
- Pour les établissements privés : le traitement repose généralement sur l'**exécution du contrat** liant l'établissement aux familles (inscription scolaire) et sur l'**intérêt légitime** de suivi pédagogique.
- Dans les deux cas, **aucun consentement des mineurs ou de leurs parents n'est requis** pour l'usage pédagogique de base (c'est l'établissement qui a la base légale), mais la **transparence** envers les familles reste obligatoire — d'où cette notice.

## 5. Durée de conservation

- Les données de l'année scolaire en cours restent accessibles pendant toute l'année.
- Au-delà, la durée de conservation recommandée est alignée sur les préconisations habituelles du secteur éducatif : **conservation des données de scolarité pendant la durée de scolarisation dans l'établissement + une durée courte after la sortie de l'élève** (typiquement quelques années, à fixer précisément par chaque établissement selon ses obligations d'archivage).
- Les messages internes et les événements de vie scolaire devraient faire l'objet d'une purge régulière au-delà de cette période — **non encore implémenté techniquement**, à prévoir avant un vrai déploiement.

## 6. Qui a accès aux données

L'accès est strictement cloisonné par rôle et par établissement (un professeur ou un parent d'un établissement A ne peut techniquement pas accéder aux données d'un établissement B, même en cas de bug applicatif — cette séparation est appliquée au niveau de la base de données elle-même, pas seulement dans l'interface).

- **Direction** : accès à l'ensemble des données de son établissement.
- **Professeur** : accès aux données des classes et matières qui lui sont affectées.
- **Élève** : accès à ses propres notes (une fois publiées), son propre cahier de textes, sa messagerie.
- **Parent** : accès aux mêmes informations que son enfant, limité aux enfants qui lui sont explicitement rattachés.

## 7. Hébergement et sécurité

- Les données sont hébergées chez **Supabase**, dans la région **eu-west-1 (Irlande, Union européenne)** — les données ne quittent donc pas l'UE.
- L'accès aux données est protégé par un système d'authentification (mot de passe) et par des règles de sécurité appliquées au niveau de la base de données (Row Level Security), qui empêchent techniquement un utilisateur de lire ou modifier des données auxquelles il n'a pas droit, indépendamment de l'application utilisée pour s'y connecter.

## 8. Droits des personnes concernées

Toute personne dont les données sont traitées (ou son représentant légal pour un mineur) dispose des droits suivants :

- **Droit d'accès** : obtenir une copie des données la concernant.
- **Droit de rectification** : corriger des données inexactes.
- **Droit à l'effacement** : demander la suppression des données (dans la limite des obligations légales de conservation d'un établissement scolaire).
- **Droit d'opposition et de limitation**, dans les conditions prévues par le RGPD.

Ces demandes doivent être adressées **en priorité à l'établissement scolaire** (responsable de traitement), qui pourra solliciter l'éditeur du logiciel si une action technique est nécessaire.

## 9. Contact

Pour toute question sur ce document ou sur le traitement des données par le logiciel : **manuelrt1203@gmail.com**

# Politique de confidentialité — ENT Scolaire

*Dernière mise à jour : 19 juillet 2026*

> **Avertissement** : ce document est un premier brouillon rédigé pour poser une base sérieuse avant tout déploiement réel auprès d'un établissement scolaire, en priorité en **République du Congo**. Il traite de données concernant des mineurs, ce qui est un sujet particulièrement sensible. **Avant toute mise en production auprès d'une vraie école, faites relire ce document par un professionnel du droit congolais** (avocat, ou service juridique de l'établissement partenaire) — le cadre légal ci-dessous s'appuie sur une recherche documentaire et non sur un conseil juridique local vérifié, et l'autorité de contrôle congolaise est encore en cours de mise en place (voir section 1bis), ce qui rend certains points d'application pratique incertains à ce stade.

## 1. Cadre légal applicable

La République du Congo dispose d'une loi de protection des données personnelles : la **Loi n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel**, entrée en vigueur le 25 novembre 2020. Elle pose des principes proches de ceux du RGPD européen : minimisation des données (article 5 — les données collectées doivent être adéquates, pertinentes et limitées à ce qui est nécessaire), et une obligation de notification des violations de données sous **72 heures** auprès de l'autorité de contrôle (article 74). La République du Congo est également membre de la CEMAC, dont les directives régionales sur la protection des données s'appliquent en complément.

**Point de vigilance** : la loi prévoit la création d'une **Commission Nationale de Protection des Données Personnelles**, mais celle-ci n'était pas encore pleinement opérationnelle à la dernière vérification (un projet de loi pour l'officialiser a été adopté en Conseil des ministres en juillet 2024). Les modalités pratiques d'application (formulaires de déclaration, contacts officiels, jurisprudence) sont donc encore incertaines — à vérifier auprès d'un juriste local avant tout déploiement réel.

**Transfert international des données** : les données de ce logiciel sont actuellement hébergées hors de République du Congo (voir section 7 — Irlande, Union européenne, via Supabase). Un transfert de données personnelles hors du pays peut être soumis à des conditions particulières selon la loi congolaise — **point à faire vérifier explicitement par un juriste local**, car ce document ne tranche pas cette question.

## 1bis. Qui fait quoi (responsable de traitement / sous-traitant)

C'est le point le plus important à comprendre après le cadre légal :

- **ENT Scolaire** (l'éditeur du logiciel) est **sous-traitant** : il fournit l'outil technique, héberge les données, mais n'est pas celui qui décide pourquoi et comment les données des élèves, parents et professeurs sont utilisées.
- **Chaque établissement scolaire** utilisant le logiciel est **responsable de traitement** : c'est l'école qui décide de faire figurer tel élève dans telle classe, qui saisit les notes, qui signale une absence, etc. C'est donc l'établissement qui doit informer ses élèves/familles/personnels et qui répond de la conformité vis-à-vis d'eux.

En pratique, cela veut dire que **chaque établissement devrait publier sa propre notice d'information** (qui peut reprendre le contenu ci-dessous en l'adaptant), et qu'un **contrat de sous-traitance** devrait être signé entre l'établissement et l'éditeur du logiciel avant toute utilisation réelle. Ce document sert de base à ces deux usages.

## 2. Éditeur du logiciel

ENT Scolaire est actuellement un projet personnel/étudiant, sans structure juridique formelle.
Contact : **manuelrt1203@gmail.com**

*(À mettre à jour si le projet est formalisé — auto-entreprise, société — voir `mentions-legales.md`.)*

## 3. Données collectées

Le logiciel a été conçu pour ne collecter que ce qui est strictement nécessaire au suivi de la scolarité (principe de minimisation des données, conforme à l'article 5 de la loi congolaise). Concrètement :

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

- Le suivi de la scolarité (notes, vie scolaire, communication école-famille) constitue la finalité principale du traitement, dans l'intérêt de la mission éducative de l'établissement.
- **Aucun consentement des mineurs ou de leurs parents n'est requis** pour cet usage pédagogique de base (c'est l'établissement qui porte la responsabilité du traitement), mais la **transparence** envers les familles reste une obligation — d'où cette notice.

## 5. Durée de conservation

- Les données de l'année scolaire en cours restent accessibles pendant toute l'année.
- Au-delà, la durée de conservation recommandée est alignée sur les préconisations habituelles du secteur éducatif : **conservation des données de scolarité pendant la durée de scolarisation dans l'établissement + une durée courte après la sortie de l'élève** (typiquement quelques années, à fixer précisément par chaque établissement selon ses obligations d'archivage).
- Les messages internes et les événements de vie scolaire font l'objet d'une **purge automatique** au-delà d'une durée configurable par établissement (36 mois par défaut) — voir l'écran "Paramètres" côté direction.

## 6. Qui a accès aux données

L'accès est strictement cloisonné par rôle et par établissement (un professeur ou un parent d'un établissement A ne peut techniquement pas accéder aux données d'un établissement B, même en cas de bug applicatif — cette séparation est appliquée au niveau de la base de données elle-même, pas seulement dans l'interface).

- **Direction** : accès à l'ensemble des données de son établissement.
- **Professeur** : accès aux données des classes et matières qui lui sont affectées.
- **Élève** : accès à ses propres notes (une fois publiées), son propre cahier de textes, sa messagerie.
- **Parent** : accès aux mêmes informations que son enfant, limité aux enfants qui lui sont explicitement rattachés.

## 7. Hébergement et sécurité

- Les données sont hébergées chez **Supabase**, dans la région **eu-west-1 (Irlande, Union européenne)** — voir la section 1 sur le transfert international des données, à faire vérifier par un juriste local.
- L'accès aux données est protégé par un système d'authentification (mot de passe) et par des règles de sécurité appliquées au niveau de la base de données (Row Level Security), qui empêchent techniquement un utilisateur de lire ou modifier des données auxquelles il n'a pas droit, indépendamment de l'application utilisée pour s'y connecter.
- En cas de violation de données, l'éditeur s'engage à en informer les établissements concernés dans les meilleurs délais, pour leur permettre de respecter leur propre obligation de notification sous 72 heures (article 74 de la loi congolaise) une fois l'autorité de contrôle pleinement opérationnelle.

## 8. Droits des personnes concernées

Toute personne dont les données sont traitées (ou son représentant légal pour un mineur) dispose de droits similaires à ceux prévus par les cadres de protection des données modernes :

- **Droit d'accès** : obtenir une copie des données la concernant.
- **Droit de rectification** : corriger des données inexactes.
- **Droit à l'effacement** : demander la suppression des données (dans la limite des obligations légales de conservation d'un établissement scolaire).
- **Droit d'opposition et de limitation**.

Ces demandes doivent être adressées **en priorité à l'établissement scolaire** (responsable de traitement), qui pourra solliciter l'éditeur du logiciel si une action technique est nécessaire.

## 9. Contact

Pour toute question sur ce document ou sur le traitement des données par le logiciel : **manuelrt1203@gmail.com**

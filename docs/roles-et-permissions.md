# Rôles et permissions de l’ENT

La cible du MVP comprend cinq profils pour le personnel et deux pour les familles. Une personne peut cumuler plusieurs fonctions dans son établissement, chacune avec un périmètre défini. L’accueil et les menus reflètent les actions qu’elle est autorisée à effectuer.

Le code actuel comporte quatre rôles, Direction, Professeur, Élève et Parent. Cette référence décrit la cible fonctionnelle. La Direction assume aujourd’hui les tâches qui seront réparties entre le chef d’établissement, la direction des études, la vie scolaire et le secrétariat. [Schéma initial et rôles actuels](../supabase/migrations/20260714202851_init_schema.sql)

## Organisation des établissements

Le décret n° 2024-2947 décrit l’équipe de maîtrise des établissements publics congolais. Au primaire, elle comprend un directeur, un adjoint et un économe. Dans le secondaire, elle comprend le directeur du collège ou le proviseur du lycée, les directeurs des études, les surveillants généraux et l’économe ou intendant. L’effectif total dépend de l’établissement. Les écoles privées peuvent reprendre leurs propres intitulés et répartir les fonctions selon leur organisation. [Journal officiel de la République du Congo, articles 43 à 53](https://sgg.cg/JO/2025/congo-jo-2025-09.pdf)

## Profils du MVP

| Profil | Accueil | Périmètre et actions |
| --- | --- | --- |
| Chef d’établissement | Relevés à traiter, publications et remise des bulletins, suivi de l’école | Supervise son établissement, attribue les fonctions du personnel, publie les résultats et consigne les décisions prises par les instances compétentes. |
| Direction des études | Avancement des relevés, dossiers à examiner, emplois du temps | Gère la structure pédagogique, les matières, coefficients, périodes et affectations. Examine, renvoie ou valide les relevés dans son périmètre. Peut publier avec une délégation explicite. |
| Professeur | Classes affectées, prochains cours, relevés à terminer ou corriger | Saisit et soumet les notes de ses matières et classes. Tient le cahier de textes, partage des ressources et signale les absences ou retards. |
| Vie scolaire | Absences et retards du jour, justificatifs à traiter | Enregistre et corrige les événements dans son périmètre, traite les justificatifs et consigne les sanctions déjà décidées. |
| Secrétariat ou scolarité | Inscriptions, dossiers élèves, liens avec les familles, bulletins à remettre | Importe les listes, inscrit les élèves, change leur classe, gère les rattachements familiaux autorisés, imprime les bulletins publiés et enregistre leur remise. |
| Élève | Cours, cahier de textes, résultats publiés, messages | Consulte ses données et les informations de sa classe, télécharge ses documents et utilise la messagerie. |
| Parent ou tuteur | Suivi de l’enfant sélectionné, emploi du temps, absences et dernier bulletin | Consulte les données des enfants auxquels il est rattaché, transmet un justificatif et contacte l’établissement. |

La responsabilité de **professeur principal** se rattache à une classe précise. Elle ouvre la synthèse de cette classe et la préparation du conseil de classe. L’ENT enregistre les décisions prises par les conseils et l’identité de la personne habilitée qui les saisit. Les accès de l’économat, de la bibliothèque et du support informatique seront définis avec leurs modules.

## Circuit des notes et des bulletins

1. Le professeur soumet le relevé pour une matière, une classe et une période.
2. La direction des études examine le relevé. Elle peut le renvoyer au professeur pour correction ou le valider.
3. Le chef d’établissement publie le relevé. La direction des études peut effectuer cette action si elle a reçu la délégation correspondante.
4. Le secrétariat imprime le bulletin publié et enregistre sa remise. L’élève et le parent rattaché peuvent consulter le bulletin publié.

Les permissions de saisie, de validation, de publication, d’impression, d’export et de remise sont distinctes. Une classe comme 6e A a son propre périmètre, même si l’établissement compte plusieurs classes du niveau 6e.

## Mise en œuvre

1. Ajouter un écran **Personnel et accès** pour attribuer ou retirer des fonctions. Enregistrer le périmètre de chaque attribution selon le besoin, à l’échelle de l’établissement, du cycle, de la classe ou de la matière.
2. Introduire progressivement les fonctions Direction des études, Vie scolaire et Secrétariat. Assurer la continuité des accès des quatre rôles actuels pendant la transition.
3. Utiliser les droits attribués pour construire les accueils, les menus et les actions affichées. Appliquer les mêmes vérifications dans les règles d’accès Supabase et les opérations serveur.
4. Consigner les changements d’accès, les modifications d’inscription, les validations et les publications avec l’identité de l’auteur et la date.
5. Vérifier les cas de cumul, de délégation et de retrait d’accès. Tester les restrictions entre établissements, entre classes d’un même niveau et entre dossiers familiaux, y compris par accès direct à une page ou à l’API.

# Sauvegardes et continuité d'activité

*Dernière mise à jour : 19 juillet 2026*

## État actuel

Le projet Supabase (`aezjxrqdydrcldkbegsc`) est sur le **plan gratuit**, qui **n'inclut aucune sauvegarde automatique** — ni sauvegarde quotidienne, ni Point-in-Time Recovery (PITR). Ces deux fonctionnalités ne démarrent qu'à partir du plan Pro. Source : documentation officielle Supabase, section [Database Backups](https://supabase.com/docs/guides/platform/backups) : *"We recommend that free tier plan projects regularly export their data using the Supabase CLI `db dump` command and maintain off-site backups."*

**Concrètement, aujourd'hui, si une donnée est supprimée par erreur, si une migration se passe mal, ou si le projet est corrompu d'une façon ou d'une autre, il n'y a aucun moyen de revenir en arrière via Supabase.** Deux scripts ont été ajoutés pour combler ce vide en attendant le passage au plan payant.

## Sauvegarde manuelle

```bash
export SUPABASE_DB_URL="postgresql://postgres:MOT_DE_PASSE@..."  # voir ci-dessous
npm run db:backup
```

La chaîne de connexion se trouve dans le dashboard Supabase : **Project Settings → Database → Connection string → URI**, en choisissant **"Direct connection"** (pas le pooler `pgbouncer`). Elle contient le mot de passe de la base — ne jamais la committer, ne jamais la partager en clair. Si le mot de passe contient des caractères spéciaux (`@`, `:`, `/`...), il doit être encodé en pourcentage (%XX) dans l'URL, sinon la connexion échoue.

Le script :
- produit un dump SQL complet dans `backups/dump-<horodatage>.sql` (dossier ignoré par git, voir `.gitignore`)
- garde automatiquement les 30 dernières sauvegardes locales, supprime les plus anciennes

**Un dossier local n'est pas une vraie sauvegarde "hors site".** Après chaque sauvegarde importante (avant une grosse migration, par exemple), copier le fichier ailleurs : un autre disque, un espace cloud personnel (Drive, etc.). Ce n'est pas automatisé pour l'instant.

## Restauration

```bash
export SUPABASE_DB_URL="postgresql://postgres:MOT_DE_PASSE@..."
bash scripts/restore-db.sh backups/dump-20260719-030000.sql
```

⚠️ **Écrase les données existantes de la base ciblée.** Ne jamais tester une restauration sur le projet de production — utiliser un [projet Supabase séparé](https://supabase.com/docs/guides/platform/clone-project) ou une branche de développement pour vérifier qu'une sauvegarde est valide.

## Recommandations

1. **Lancer `npm run db:backup` régulièrement** (au minimum avant chaque migration de schéma qui touche des données réelles, et idéalement de façon récurrente — un job planifié sur ta machine, ou une GitHub Action si le dépôt est sur GitHub, ferait ça automatiquement).
2. **Tester une restauration au moins une fois** avant d'avoir de vraies données d'école, pour être sûr que la procédure fonctionne le jour où ça compte vraiment.
3. **Passer au plan Pro Supabase avant d'ouvrir à un vrai établissement** — les sauvegardes quotidiennes automatiques (et PITR en option) remplaceront alors ce mécanisme manuel comme filet de sécurité principal ; ces scripts resteront utiles en complément (export ponctuel, sauvegarde hors-site).

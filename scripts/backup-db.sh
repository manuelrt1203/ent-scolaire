#!/usr/bin/env bash
# Sauvegarde manuelle de la base Supabase (le plan gratuit n'a AUCUNE
# sauvegarde automatique — voir legal/continuite-activite.md). Nécessite
# la variable d'environnement SUPABASE_DB_URL (chaîne de connexion Postgres
# complète, avec mot de passe), disponible dans le dashboard Supabase :
# Project Settings > Database > Connection string > URI (choisir "Direct
# connection", pas le pooler). Ne jamais committer cette valeur.
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Erreur : la variable d'environnement SUPABASE_DB_URL n'est pas définie." >&2
  echo "Récupère-la sur https://supabase.com/dashboard/project/aezjxrqdydrcldkbegsc/settings/database" >&2
  echo "  (section Connection string > URI > Direct connection)" >&2
  echo "Puis : export SUPABASE_DB_URL='postgresql://postgres:MOT_DE_PASSE@...'" >&2
  exit 1
fi

mkdir -p backups
horodatage="$(date +%Y%m%d-%H%M%S)"
fichier="backups/dump-${horodatage}.sql"

echo "Sauvegarde en cours vers ${fichier}..."
npx --yes supabase db dump --db-url "$SUPABASE_DB_URL" -f "$fichier"
echo "OK : ${fichier} ($(du -h "$fichier" | cut -f1))"

# Ne garde que les 30 dernières sauvegardes locales pour éviter d'accumuler
# indéfiniment — pense à copier les sauvegardes importantes ailleurs
# (un autre disque, un stockage cloud) : ce dossier local n'est pas en soi
# une vraie sauvegarde "hors site".
ls -1t backups/dump-*.sql 2>/dev/null | tail -n +31 | xargs -r rm --

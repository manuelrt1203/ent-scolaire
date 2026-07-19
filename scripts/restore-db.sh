#!/usr/bin/env bash
# Restaure une sauvegarde produite par backup-db.sh. ATTENTION : écrase les
# données actuelles de la base ciblée par SUPABASE_DB_URL. À utiliser
# uniquement en cas de sinistre réel, ou pour vérifier qu'une sauvegarde
# est valide sur un projet Supabase de test (jamais sur la prod pour tester).
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Erreur : SUPABASE_DB_URL n'est pas définie (voir backup-db.sh)." >&2
  exit 1
fi

fichier="${1:-}"
if [ -z "$fichier" ] || [ ! -f "$fichier" ]; then
  echo "Usage : SUPABASE_DB_URL=... bash scripts/restore-db.sh backups/dump-XXXXXXXX-XXXXXX.sql" >&2
  echo "Sauvegardes disponibles localement :" >&2
  ls -1t backups/dump-*.sql 2>/dev/null >&2 || echo "  (aucune)" >&2
  exit 1
fi

echo "Restauration de ${fichier} vers la base ciblée par SUPABASE_DB_URL."
echo "Ceci va écraser les données existantes. Tape OUI pour confirmer :"
read -r confirmation
if [ "$confirmation" != "OUI" ]; then
  echo "Annulé."
  exit 1
fi

psql "$SUPABASE_DB_URL" -f "$fichier"
echo "Restauration terminée."

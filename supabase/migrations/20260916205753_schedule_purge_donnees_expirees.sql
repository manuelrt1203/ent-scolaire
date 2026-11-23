-- La fonction purger_donnees_expirees() existait déjà (respecte
-- retention_vie_scolaire_mois/retention_messagerie_mois par établissement)
-- mais n'était appelée par rien : ni cron, ni tâche planifiée. L'écran
-- Paramètres direction promet une purge "chaque nuit" — on la rend réelle.
select cron.schedule(
  'purger-donnees-expirees',
  '0 2 * * *',
  $$select public.purger_donnees_expirees();$$
);

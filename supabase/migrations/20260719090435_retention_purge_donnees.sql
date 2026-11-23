-- Purge automatique des données de messagerie et de vie scolaire au-delà
-- d'une durée de conservation configurable par établissement (RGPD, voir
-- legal/politique-confidentialite.md). Les notes/relevés ne sont PAS purgés
-- automatiquement : ce sont les documents officiels de scolarité, à
-- conserver plus durablement (hors scope de cette migration).

create extension if not exists pg_cron with schema extensions;

alter table etablissements
  add column retention_vie_scolaire_mois integer not null default 36,
  add column retention_messagerie_mois integer not null default 36;

alter table etablissements
  add constraint retention_vie_scolaire_mois_positif check (retention_vie_scolaire_mois > 0),
  add constraint retention_messagerie_mois_positif check (retention_messagerie_mois > 0);

create or replace function purger_donnees_expirees() returns void
  language plpgsql security definer set search_path = public as $$
begin
  delete from vie_scolaire_evenements v
  using classes c, etablissements e
  where v.classe_id = c.id
    and c.etablissement_id = e.id
    and v.date < (current_date - (e.retention_vie_scolaire_mois::text || ' months')::interval);

  delete from messages m
  using profiles p, etablissements e
  where m.expediteur_id = p.id
    and p.etablissement_id = e.id
    and m.created_at < (now() - (e.retention_messagerie_mois::text || ' months')::interval);
end;
$$;

select cron.schedule('purge-donnees-expirees', '0 3 * * *', $$select purger_donnees_expirees()$$);

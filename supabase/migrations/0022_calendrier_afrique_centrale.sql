alter table public.etablissements
  drop constraint etablissements_pays_calendrier_valide,
  add column fuseau_calendrier text,
  add constraint etablissements_pays_calendrier_valide
    check (pays_calendrier in ('FR', 'CG', 'GA', 'AO', 'CM', 'CF', 'TD', 'CD', 'GQ', 'ST')),
  add constraint etablissements_fuseau_calendrier_valide
    check (
      case when pays_calendrier = 'CD'
        then coalesce(fuseau_calendrier in ('Africa/Kinshasa', 'Africa/Lubumbashi'), false)
        else fuseau_calendrier is null
      end
    );

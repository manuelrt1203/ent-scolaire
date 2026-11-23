-- Distingue primaire/collège/lycée (jusqu'ici classes.niveau était un texte
-- libre sans lien avec nom, ne permettant ni filtre ni validation — voir
-- discussion du 2026-07-17). cycle + niveau deviennent des listes fermées,
-- nom reste le libellé spécifique de la classe (ex. "6ème A", "Bilingue").
create type cycle_scolaire as enum ('primaire', 'college', 'lycee');

alter table classes add column cycle cycle_scolaire;

-- Backfill des 3 classes de test existantes (toutes lycée) avant de rendre
-- la colonne obligatoire et d'ajouter la contrainte de cohérence niveau/cycle.
update classes set cycle = 'lycee';
update classes set niveau = 'Seconde' where niveau = 'Seconde A';

alter table classes alter column cycle set not null;

alter table classes add constraint classes_niveau_valide check (
  (cycle = 'primaire' and niveau in ('CP', 'CE1', 'CE2', 'CM1', 'CM2'))
  or (cycle = 'college' and niveau in ('6ème', '5ème', '4ème', '3ème'))
  or (cycle = 'lycee' and niveau in ('Seconde', 'Première', 'Terminale'))
);

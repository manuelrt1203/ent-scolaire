-- Académie de l'établissement (ex. « Montpellier »), au format du jeu de données
-- data.education.gouv.fr « fr-en-calendrier-scolaire » (champ location).
-- Nullable : tant que la direction ne l'a pas choisie, seuls les jours fériés sont affichés.
alter table etablissements add column academie text;

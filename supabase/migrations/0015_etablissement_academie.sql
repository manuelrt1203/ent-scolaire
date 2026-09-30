-- Académie de l'établissement (ex. « Montpellier »), au format du jeu de données
-- data.education.gouv.fr « fr-en-calendrier-scolaire » (champ location).
-- Sert à afficher les vacances scolaires de la bonne zone dans le calendrier.
-- Nullable : tant que la direction ne l'a pas choisie, seuls les jours fériés sont affichés.
-- Lecture/écriture couvertes par les policies existantes etablissements_select / etablissements_write.
alter table etablissements add column academie text;

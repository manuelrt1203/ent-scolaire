-- niveau était nullable ; le CHECK ajouté juste avant laisserait passer
-- niveau=NULL (Postgres traite un CHECK qui évalue NULL comme satisfait),
-- donc le rendre NOT NULL explicitement pour fermer ce trou.
alter table classes alter column niveau set not null;

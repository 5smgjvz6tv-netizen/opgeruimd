-- Takenbibliotheek: onthoud welke ruimtes een huishouden heeft en welke bibliotheektaken al zijn toegevoegd.
alter table households add column rooms text[];
alter table tasks add column catalog_id text;
create unique index tasks_catalog_once on tasks (household_id, catalog_id) where catalog_id is not null and not archived;

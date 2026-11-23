-- Taal per persoon, zodat meldingen van de server in de juiste taal komen.
alter table members add column lang text not null default 'nl' check (lang in ('nl', 'en'));

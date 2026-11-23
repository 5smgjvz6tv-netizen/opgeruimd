-- Hoeveel mensen wonen er in huis (1 = alleen). Bepaalt of de app "samen"-functies laat zien.
alter table households add column size int not null default 2 check (size between 1 and 8);

INSERT INTO regions (id, name, sort_order) VALUES
  ('norte', 'Norte', 1), ('nordeste', 'Nordeste', 2),
  ('centro-oeste', 'Centro-Oeste', 3), ('sudeste', 'Sudeste', 4), ('sul', 'Sul', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

INSERT INTO levels (region_id, level_number, name, max_score) VALUES
  ('norte', 1, 'Introdução', 100), ('norte', 2, 'Aleatoriedade', 100),
  ('norte', 3, 'Contra o tempo', 100), ('norte', 4, 'Pegadinhas', 100),
  ('norte', 5, 'Desafio surpresa', 100), ('norte', 6, 'Desafio final', 100)
ON DUPLICATE KEY UPDATE name = VALUES(name), max_score = VALUES(max_score);

INSERT INTO medals (id, name, description, region_id, criterion_type) VALUES
  ('norte-completo', 'Medalha do Norte', 'Conclua todos os níveis da região Norte.', 'norte', 'region_complete')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

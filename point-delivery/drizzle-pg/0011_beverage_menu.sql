-- Authorized beverage menu. Existing stock and historical order values are preserved.
WITH menu(id,name,product_name,extra_type,flavor,size,price) AS (VALUES
('refrigerante-1-litro','Coca-Cola · Original · 1 litro','Coca-Cola','refrigerante','Original','1 litro','1000'),
('coca-zero-1-litro','Coca-Cola · Zero · 1 litro','Coca-Cola','refrigerante','Zero','1 litro','1000'),
('fanta-1-litro','Fanta · Original · 1 litro','Fanta','refrigerante','Original','1 litro','1000'),
('guarana-1-litro','Guaraná · Original · 1 litro','Guaraná','refrigerante','Original','1 litro','1000'),
('pepsi-1-litro','Pepsi · Original · 1 litro','Pepsi','refrigerante','Original','1 litro','1000'),
('coca-600ml','Coca-Cola · Original · 600 ml','Coca-Cola','refrigerante','Original','600 ml','800'),
('monster','Monster · Unidade','Monster','energetico','','Unidade','1300'),
('refrigerante','Coca-Cola · Original · Lata','Coca-Cola','refrigerante','Original','Lata','600'),
('coca-zero-lata','Coca-Cola · Zero · Lata','Coca-Cola','refrigerante','Zero','Lata','600'),
('guarana-lata','Guaraná · Original · Lata','Guaraná','refrigerante','Original','Lata','600'),
('guarana-zero-lata','Guaraná · Zero · Lata','Guaraná','refrigerante','Zero','Lata','600'),
('pepsi-lata','Pepsi · Original · Lata','Pepsi','refrigerante','Original','Lata','600'),
('fanta-lata','Fanta · Original · Lata','Fanta','refrigerante','Original','Lata','600'),
('agua-sem-gas','Água sem gás · Unidade','Água sem gás','agua','','Unidade','300'),
('agua-com-gas','Água com gás · Unidade','Água com gás','agua','','Unidade','500'),
('coca-mini-pet','Coca-Cola · Original · Mini PET','Coca-Cola','refrigerante','Original','Mini PET','300'),
('fanta-mini-pet','Fanta · Original · Mini PET','Fanta','refrigerante','Original','Mini PET','300'),
('guarana-mini-pet','Guaraná · Original · Mini PET','Guaraná','refrigerante','Original','Mini PET','300'),
('pepsi-mini-pet','Pepsi · Original · Mini PET','Pepsi','refrigerante','Original','Mini PET','300'),
('suco-del-valle-laranja','Del Valle · Laranja · Unidade','Del Valle','suco','Laranja','Unidade','600'),
('suco-skinka-laranja','Skinka · Laranja · Unidade','Skinka','suco','Laranja','Unidade','600'),
('suco-laranja-300ml','Suco da fruta · Laranja · 300 ml','Suco da fruta','suco','Laranja','300 ml','800'),
('suco-maracuja-300ml','Suco da fruta · Maracujá · 300 ml','Suco da fruta','suco','Maracujá','300 ml','700'),
('suco-caja-300ml','Suco da fruta · Cajá · 300 ml','Suco da fruta','suco','Cajá','300 ml','600'),
('suco-cupuacu-300ml','Suco da fruta · Cupuaçu · 300 ml','Suco da fruta','suco','Cupuaçu','300 ml','600'),
('suco-acerola-300ml','Suco da fruta · Acerola · 300 ml','Suco da fruta','suco','Acerola','300 ml','600'),
('suco-graviola-300ml','Suco da fruta · Graviola · 300 ml','Suco da fruta','suco','Graviola','300 ml','600'),
('suco-goiaba-300ml','Suco da fruta · Goiaba · 300 ml','Suco da fruta','suco','Goiaba','300 ml','600')
), inserted AS (
  INSERT INTO ingredients(id,name,category,unit,stock,low_stock,max_qty,price,active,extra_type,product_name,flavor,size,featured,description)
  SELECT id,name,'Complementos','unidade',10,5,4,price::integer,1,extra_type,product_name,flavor,size,1,'' FROM menu
  ON CONFLICT(id) DO NOTHING
  RETURNING id,stock
)
INSERT INTO movements(ingredient_id,delta,reason,created_at)
SELECT id,stock,'Cadastro de acompanhamento',(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)*1000)::bigint FROM inserted;

WITH menu(id,name,product_name,extra_type,flavor,size,price) AS (VALUES
('refrigerante-1-litro','Coca-Cola · Original · 1 litro','Coca-Cola','refrigerante','Original','1 litro','1000'),
('coca-zero-1-litro','Coca-Cola · Zero · 1 litro','Coca-Cola','refrigerante','Zero','1 litro','1000'),
('fanta-1-litro','Fanta · Original · 1 litro','Fanta','refrigerante','Original','1 litro','1000'),
('guarana-1-litro','Guaraná · Original · 1 litro','Guaraná','refrigerante','Original','1 litro','1000'),
('pepsi-1-litro','Pepsi · Original · 1 litro','Pepsi','refrigerante','Original','1 litro','1000'),
('coca-600ml','Coca-Cola · Original · 600 ml','Coca-Cola','refrigerante','Original','600 ml','800'),
('monster','Monster · Unidade','Monster','energetico','','Unidade','1300'),
('refrigerante','Coca-Cola · Original · Lata','Coca-Cola','refrigerante','Original','Lata','600'),
('coca-zero-lata','Coca-Cola · Zero · Lata','Coca-Cola','refrigerante','Zero','Lata','600'),
('guarana-lata','Guaraná · Original · Lata','Guaraná','refrigerante','Original','Lata','600'),
('guarana-zero-lata','Guaraná · Zero · Lata','Guaraná','refrigerante','Zero','Lata','600'),
('pepsi-lata','Pepsi · Original · Lata','Pepsi','refrigerante','Original','Lata','600'),
('fanta-lata','Fanta · Original · Lata','Fanta','refrigerante','Original','Lata','600'),
('agua-sem-gas','Água sem gás · Unidade','Água sem gás','agua','','Unidade','300'),
('agua-com-gas','Água com gás · Unidade','Água com gás','agua','','Unidade','500'),
('coca-mini-pet','Coca-Cola · Original · Mini PET','Coca-Cola','refrigerante','Original','Mini PET','300'),
('fanta-mini-pet','Fanta · Original · Mini PET','Fanta','refrigerante','Original','Mini PET','300'),
('guarana-mini-pet','Guaraná · Original · Mini PET','Guaraná','refrigerante','Original','Mini PET','300'),
('pepsi-mini-pet','Pepsi · Original · Mini PET','Pepsi','refrigerante','Original','Mini PET','300'),
('suco-del-valle-laranja','Del Valle · Laranja · Unidade','Del Valle','suco','Laranja','Unidade','600'),
('suco-skinka-laranja','Skinka · Laranja · Unidade','Skinka','suco','Laranja','Unidade','600'),
('suco-laranja-300ml','Suco da fruta · Laranja · 300 ml','Suco da fruta','suco','Laranja','300 ml','800'),
('suco-maracuja-300ml','Suco da fruta · Maracujá · 300 ml','Suco da fruta','suco','Maracujá','300 ml','700'),
('suco-caja-300ml','Suco da fruta · Cajá · 300 ml','Suco da fruta','suco','Cajá','300 ml','600'),
('suco-cupuacu-300ml','Suco da fruta · Cupuaçu · 300 ml','Suco da fruta','suco','Cupuaçu','300 ml','600'),
('suco-acerola-300ml','Suco da fruta · Acerola · 300 ml','Suco da fruta','suco','Acerola','300 ml','600'),
('suco-graviola-300ml','Suco da fruta · Graviola · 300 ml','Suco da fruta','suco','Graviola','300 ml','600'),
('suco-goiaba-300ml','Suco da fruta · Goiaba · 300 ml','Suco da fruta','suco','Goiaba','300 ml','600')
)
UPDATE ingredients AS i
SET name=menu.name,product_name=menu.product_name,extra_type=menu.extra_type,
    flavor=menu.flavor,size=menu.size,price=menu.price::integer,featured=1
FROM menu WHERE i.id=menu.id AND i.category='Complementos';

UPDATE ingredients SET featured=0 WHERE id='suco-cacau-300ml' AND category='Complementos';

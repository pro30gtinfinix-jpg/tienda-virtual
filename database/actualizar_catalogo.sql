-- actualizar_catalogo.sql
-- Para quien YA tiene la base con estado_inventario: borra los productos
-- y carga los 15 nuevos (con URLs y categorías nuevas). Los pedidos se conservan.
-- Pega en DB Browser > Ejecutar SQL y luego 'Escribir cambios'.

DELETE FROM productos;
DELETE FROM sqlite_sequence WHERE name = 'productos';
INSERT INTO productos (nombre, descripcion, categoria, talla, color, precio_compra, precio_venta, estado_inventario, imagen) VALUES
('Buso deportivo azul marino franjas gris', 'Buso deportivo azul marino con franjas grises. Corte para dama.', 'Busos/Pantalones', 'L', 'Azul marino', 40, 50, 'Disponible', 'https://drive.google.com/file/d/1ZhsnLZryq06998Ez11JbrRzQZUaDc8dd/view?usp=sharing'),
('Buso Kappa cierre bota pie', 'Buso Kappa con cierre en el bota pie.', 'Busos/Pantalones', 'M/L', 'Negro', 10, 45, 'Disponible', 'https://drive.google.com/file/d/1YOxG8DXtUMY0WwU2nOZmVnfiqVgKxW5c/view?usp=sharing'),
('Canguro Great Smoky', 'Canguro celeste con estampado Great Smoky.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Celeste', 20, 35, 'Disponible', 'https://drive.google.com/file/d/1CephAkdiPCO4rjosawWUfuxIuO9CbDZw/view?usp=sharing'),
('Canguro deportivo Blue Devils Baseball', 'Canguro deportivo bicolor Blue Devils Baseball.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Gris claro y azul', 35, 45, 'Disponible', 'https://drive.google.com/file/d/14oAyo7rDFyPpxsnYMlq4-wCtombIq33J/view?usp=sharing'),
('Canguro Seton Hall', 'Canguro gris claro Seton Hall.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Gris claro', 35, 45, 'Disponible', 'https://drive.google.com/file/d/1ATF15Dq4EWwYKY9B2yAu6Zv3dBoEegTY/view?usp=sharing'),
('Canguro Addams Family', 'Canguro gris oscuro The Addams Family.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Gris oscuro', 35, 45, 'Disponible', 'https://drive.google.com/file/d/1sraVKH_I_8P5gObuujMo24wyDWJoH6ao/view?usp=sharing'),
('Canguro Crusaders Adidas', 'Canguro plomo Crusaders de Adidas.', 'Canguros/Sudaderas/Chaquetas', 'XL', 'Plomo', 20, 40, 'Disponible', 'https://drive.google.com/file/d/1MwZjro-sbArUhqUrEahZc009H6HiqN4t/view?usp=sharing'),
('Canguro Reebok Detroit Pistons', 'Canguro Reebok Detroit Pistons azul marino.', 'Canguros/Sudaderas/Chaquetas', 'L', 'Azul marino', 35, 50, 'Disponible', 'https://drive.google.com/file/d/1oyrwd68_F0oUptAidLWJ_TB9JXfAr7ud/view?usp=sharing'),
('Canguro Stitch', 'Canguro Stitch azul marino. Corte para dama.', 'Canguros/Sudaderas/Chaquetas', 'XL', 'Azul marino', 35, 50, 'Disponible', 'https://drive.google.com/file/d/1g7dmWE9T4jHm8zVlXiGqaq8hOIB_N4J_/view?usp=sharing'),
('Chaqueta polar Vita', 'Chaqueta polar Vita combinada negro con gris claro.', 'Canguros/Sudaderas/Chaquetas', 'M', 'Negro y gris claro', 36, 70, 'Disponible', 'https://drive.google.com/file/d/1zKSmC1rZOf28y4qlHPAThQ4Vaqde4DU2/view?usp=sharing'),
('Chaqueta universitaria Dogg Supply', 'Chaqueta universitaria Dogg Supply.', 'Canguros/Sudaderas/Chaquetas', 'M', '', 35, 100, 'Disponible', 'https://drive.google.com/file/d/1zN3wdlpMJGSI4vfOTpBEt-bTlgTE3e_5/view?usp=sharing'),
('Chompa polar medio cierre 47''', 'Chompa polar con medio cierre, marca 47''.', 'Canguros/Sudaderas/Chaquetas', 'M/L', 'Gris claro', 35, 50, 'Disponible', 'https://drive.google.com/file/d/1C3aSaYRtAcis_8dZVrNCkuBBmhR-Z4hr/view?usp=sharing'),
('Sudadera Dickies', 'Sudadera gris Dickies.', 'Canguros/Sudaderas/Chaquetas', 'M', 'Gris', 35, 80, 'Disponible', 'https://drive.google.com/file/d/1wwT5wBgwa39mJ1BZgmQR3-EdWiimNva6/view?usp=sharing'),
('Sudadera Carnegie Mellon 47'' unisex', 'Sudadera Carnegie Mellon de 47'', unisex.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Gris claro', 35, 50, 'Disponible', 'https://drive.google.com/file/d/1Ocr9Vyb91SPf0vZrrcfXZXmRbvnnW2i7/view?usp=sharing'),
('Sudadera Flamin''Hot oversize llamas en mangas', 'Sudadera oversize Flamin''Hot con llamas en las mangas, unisex.', 'Canguros/Sudaderas/Chaquetas', 'S', 'Negro', 35, 50, 'Disponible', 'https://drive.google.com/file/d/1UszzjI2l4Ye-4bXbTFOquCV_qMjYU98D/view?usp=sharing');

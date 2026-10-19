-- agregar_precio_final.sql
-- Opcional: la página ya agrega esta columna sola al abrirse. Úsalo solo
-- si quieres hacerlo a mano en DB Browser (Ejecutar SQL > Escribir cambios).
ALTER TABLE detalle_pedido ADD COLUMN precio_final REAL;

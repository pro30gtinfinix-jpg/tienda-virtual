-- GENGAR STUDIO - Modelo relacional para Microsoft Access
-- Access ejecuta una sentencia a la vez: Crear > Diseno de consulta > Vista SQL
-- (pegar y ejecutar cada bloque por separado, en este orden).

CREATE TABLE productos (
    id COUNTER PRIMARY KEY,
    nombre TEXT(150) NOT NULL,
    descripcion MEMO,
    categoria TEXT(60) NOT NULL,
    talla TEXT(20),
    color TEXT(40),
    precio_compra DOUBLE NOT NULL,
    precio_venta DOUBLE NOT NULL,
    estado_inventario TEXT(15) NOT NULL,
    imagen MEMO
);

CREATE TABLE pedidos (
    id COUNTER PRIMARY KEY,
    cliente TEXT(100) NOT NULL,
    whatsapp TEXT(20) NOT NULL,
    lugar TEXT(100) NOT NULL,
    fecha TEXT(10) NOT NULL,
    hora TEXT(5) NOT NULL,
    total DOUBLE NOT NULL,
    estado TEXT(10) NOT NULL,
    fecha_pedido TEXT(19),
    fecha_pago TEXT(19)
);

CREATE TABLE detalle_pedido (
    id COUNTER PRIMARY KEY,
    pedido_id LONG NOT NULL,
    producto_id LONG,
    producto_nombre TEXT(150) NOT NULL,
    cantidad LONG NOT NULL,
    precio_venta_unitario DOUBLE NOT NULL,
    precio_compra_unitario DOUBLE NOT NULL,
    precio_final DOUBLE
);

ALTER TABLE detalle_pedido ADD CONSTRAINT fk_detalle_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id);
ALTER TABLE detalle_pedido ADD CONSTRAINT fk_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id);

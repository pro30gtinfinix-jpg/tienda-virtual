-- =====================================================
-- GENGAR STUDIO - Esquema para PostgreSQL (Render)
-- La página lo ejecuta SOLA la primera vez que se conecta
-- a una base vacía. No hace falta pegarlo a mano.
-- Las prendas empiezan en 0: el administrador las agrega
-- una por una desde el panel.
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    talla TEXT,
    color TEXT,
    precio_compra DOUBLE PRECISION NOT NULL,
    precio_venta DOUBLE PRECISION NOT NULL,
    estado_inventario TEXT NOT NULL DEFAULT 'Disponible',
    imagen TEXT
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    lugar TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_pedido TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'America/La_Paz', 'YYYY-MM-DD HH24:MI:SS'),
    fecha_pago TEXT
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_venta_unitario DOUBLE PRECISION NOT NULL,
    precio_compra_unitario DOUBLE PRECISION NOT NULL,
    precio_final DOUBLE PRECISION
);

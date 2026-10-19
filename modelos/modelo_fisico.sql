-- =====================================================================
-- GENGAR STUDIO - MODELO FISICO (PostgreSQL / Neon)
-- Abrir con Bloc de notas o VS Code. Se puede pegar en el SQL Editor de Neon.
-- =====================================================================

-- ---------- TABLA 1: productos (las prendas del catalogo) ----------
CREATE TABLE IF NOT EXISTS productos (
    id                SERIAL PRIMARY KEY,                 -- clave primaria autonumerica
    nombre            TEXT NOT NULL,
    descripcion       TEXT,
    categoria         TEXT NOT NULL,
    talla             TEXT,
    color             TEXT,
    precio_compra     DOUBLE PRECISION NOT NULL CHECK (precio_compra >= 0),
    precio_venta      DOUBLE PRECISION NOT NULL CHECK (precio_venta  >= 0),
    estado_inventario TEXT NOT NULL DEFAULT 'Disponible'
        CHECK (estado_inventario IN ('Disponible','Reservada','Vendida')),
    imagen            TEXT                                 -- URL (Google Drive u otra)
);

-- ---------- TABLA 2: pedidos (una compra de un cliente) ----------
CREATE TABLE IF NOT EXISTS pedidos (
    id           SERIAL PRIMARY KEY,
    cliente      TEXT NOT NULL,
    whatsapp     TEXT NOT NULL,
    lugar        TEXT NOT NULL,                            -- lugar de entrega
    fecha        TEXT NOT NULL,                            -- fecha de entrega
    hora         TEXT NOT NULL,                            -- hora de entrega
    total        DOUBLE PRECISION NOT NULL CHECK (total >= 0),
    estado       TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK (estado IN ('Pendiente','Pagado')),
    fecha_pedido TEXT NOT NULL DEFAULT
        to_char(now() AT TIME ZONE 'America/La_Paz','YYYY-MM-DD HH24:MI:SS'),
    fecha_pago   TEXT                                      -- se llena al confirmar el pago
);

-- ---------- TABLA 3: detalle_pedido (prendas de cada pedido) ----------
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id                     SERIAL PRIMARY KEY,
    pedido_id              INTEGER NOT NULL
        REFERENCES pedidos(id),                            -- relacion 1 a N con pedidos
    producto_id            INTEGER
        REFERENCES productos(id) ON DELETE SET NULL,       -- relacion 1 a N con productos
    producto_nombre        TEXT NOT NULL,                  -- copia del nombre al comprar
    cantidad               INTEGER NOT NULL CHECK (cantidad > 0),
    precio_venta_unitario  DOUBLE PRECISION NOT NULL,
    precio_compra_unitario DOUBLE PRECISION NOT NULL,
    precio_final           DOUBLE PRECISION                -- NULL hasta que el admin lo fija
);

-- ---------- INDICES (aceleran las consultas mas usadas) ----------
CREATE INDEX IF NOT EXISTS idx_detalle_pedido  ON detalle_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_horario  ON pedidos(lugar, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado_inventario);

-- ---------- CONSULTAS DE EJEMPLO PARA LA DEFENSA ----------
-- SELECT * FROM productos;
-- SELECT * FROM pedidos ORDER BY id DESC;
-- SELECT p.cliente, d.producto_nombre, d.precio_final
--   FROM pedidos p JOIN detalle_pedido d ON d.pedido_id = p.id;

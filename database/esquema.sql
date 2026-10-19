-- =====================================================
-- GENGAR STUDIO - Esquema de base de datos (SQLite)
-- Para usar con "DB Browser for SQLite"
-- =====================================================
-- Instrucciones:
-- 1. Abre DB Browser for SQLite.
-- 2. Archivo > Nueva base de datos... > guárdala como "gengar_studio.db"
--    dentro de la carpeta /database/ de tu proyecto.
-- 3. Ve a la pestaña "Ejecutar SQL".
-- 4. Pega todo este archivo y presiona "Ejecutar todo" (el ícono de play).
-- 5. Ve a "Escribir cambios" para guardar el archivo .db.
-- =====================================================

-- Tabla de productos: es la única fuente de verdad del catálogo.
--
-- Cada prenda es única (normalmente 1 sola unidad), así que en vez de
-- un "stock" numérico, el inventario se controla con un estado:
--   'Disponible' -> se muestra en el catálogo público, se puede comprar
--   'Reservada'  -> un cliente ya envió el pedido por WhatsApp, se
--                   esconde del catálogo público mientras se confirma
--                   el pago, pero TODAVÍA NO se cuenta como venta
--   'Vendida'    -> el administrador confirmó el pago; venta definitiva
--
-- El campo "imagen" guarda la URL de la foto como texto. Ya no existe
-- la carpeta /imagenes/: cambiar una foto es cambiar la URL.
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    talla TEXT,
    color TEXT,
    precio_compra REAL NOT NULL,
    precio_venta REAL NOT NULL,
    estado_inventario TEXT NOT NULL DEFAULT 'Disponible',
    imagen TEXT
);

-- Tabla de pedidos: un pedido = una compra realizada por un cliente.
-- fecha_pedido: cuándo el cliente lo envió por WhatsApp.
-- fecha_pago: cuándo el administrador confirmó el pago (queda vacío
-- hasta que eso ocurre). Esta es la fecha que se usa en el historial
-- de ventas, porque es cuando la venta se vuelve definitiva.
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    lugar TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    total REAL NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_pedido TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_pago TEXT
);

-- Tabla de detalle_pedido: qué productos (y cuántos) tiene cada pedido.
-- Se guarda una "foto" del nombre y los precios en el momento de la
-- compra (producto_nombre, precio_venta_unitario, precio_compra_unitario)
-- para que, si el admin borra o cambia el precio de un producto después,
-- el historial de ventas y las ganancias pasadas no se alteren.
-- Esta misma tabla es la que alimenta el historial de ventas.
-- precio_final: lo escribe el administrador en "Ventas y ganancias" una vez
-- confirmado el pago. Mientras esté vacío (NULL) se puede escribir; cuando
-- ya tiene valor, queda bloqueado y la venta cuenta en las ganancias.
CREATE TABLE detalle_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_venta_unitario REAL NOT NULL,
    precio_compra_unitario REAL NOT NULL,
    precio_final REAL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================
-- Sin productos iniciales: el administrador agrega las prendas
-- una por una desde el panel. (Para cargar 15 prendas de ejemplo
-- puedes ejecutar database/actualizar_catalogo.sql)
-- =====================================================

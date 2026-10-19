<?php
// =====================================================
// productos.php
// Un solo archivo que atiende las operaciones del catálogo,
// según el método HTTP que use JavaScript con fetch():
//   GET    -> devolver todos los productos
//   POST   -> crear un producto nuevo (siempre nace "Disponible")
//   PUT    -> editar un producto, O (si el body trae accion:"liberar")
//             volver a ponerlo "Disponible" sin tocar sus demás datos
//   DELETE -> eliminar un producto (?id=X)
// =====================================================

header("Content-Type: application/json");
require "conexion.php";

$metodo = $_SERVER["REQUEST_METHOD"];

// ---------- GET: listar todos los productos ----------
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM productos ORDER BY id");
    $productos = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($productos);
}

// ---------- POST: crear un producto nuevo ----------
else if ($metodo === "POST") {
    $datos = json_decode(file_get_contents("php://input"), true);

    // Un producto nuevo siempre empieza "Disponible" en el catálogo
    $sql = "INSERT INTO productos (nombre, descripcion, categoria, talla, color, precio_compra, precio_venta, estado_inventario, imagen)
            VALUES (:nombre, :descripcion, :categoria, :talla, :color, :precio_compra, :precio_venta, 'Disponible', :imagen)";

    // RETURNING id devuelve el número del producto nuevo (funciona en
    // PostgreSQL y en SQLite 3.35 o más nuevo).
    $consulta = $conexion->prepare($sql . " RETURNING id");
    $consulta->execute(array(
        ":nombre" => $datos["nombre"],
        ":descripcion" => $datos["descripcion"],
        ":categoria" => $datos["categoria"],
        ":talla" => $datos["talla"],
        ":color" => $datos["color"],
        ":precio_compra" => $datos["precio_compra"],
        ":precio_venta" => $datos["precio_venta"],
        ":imagen" => $datos["imagen"]
    ));

    $nuevoId = $consulta->fetchColumn();
    $consulta->closeCursor();
    echo json_encode(array("id" => $nuevoId));
}

// ---------- PUT: editar un producto, o liberarlo ----------
else if ($metodo === "PUT") {
    $datos = json_decode(file_get_contents("php://input"), true);

    // Acción especial: el botón "Liberar" del panel admin solo envía
    // {id, accion:"liberar"}, sin el resto de los campos. Sirve para
    // volver a poner Disponible una prenda Reservada o Vendida.
    if (isset($datos["accion"]) && $datos["accion"] === "liberar") {
        // Si la prenda estaba reservada en un pedido pendiente, también se
        // quita de ese pedido para que Reservas no quede desactualizado.
        require_once "pedidos_funciones.php";
        $buscar = $conexion->prepare(
            "SELECT d.id FROM detalle_pedido d JOIN pedidos p ON p.id = d.pedido_id
             WHERE d.producto_id = :id AND p.estado = 'Pendiente'"
        );
        $buscar->execute(array(":id" => $datos["id"]));
        $pendientes = $buscar->fetchAll(PDO::FETCH_ASSOC);
        for ($i = 0; $i < count($pendientes); $i++) {
            cancelarReservaDetalle($conexion, $pendientes[$i]["id"]);
        }
        $consulta = $conexion->prepare("UPDATE productos SET estado_inventario = 'Disponible' WHERE id = :id");
        $consulta->execute(array(":id" => $datos["id"]));
        echo json_encode(array("ok" => true));
        exit;
    }

    // Edición normal del formulario (no toca el estado de inventario,
    // eso se maneja solo mediante el flujo de pedido/pago/liberar)
    $sql = "UPDATE productos SET
                nombre = :nombre,
                descripcion = :descripcion,
                categoria = :categoria,
                talla = :talla,
                color = :color,
                precio_compra = :precio_compra,
                precio_venta = :precio_venta,
                imagen = :imagen
            WHERE id = :id";

    $consulta = $conexion->prepare($sql);
    $consulta->execute(array(
        ":nombre" => $datos["nombre"],
        ":descripcion" => $datos["descripcion"],
        ":categoria" => $datos["categoria"],
        ":talla" => $datos["talla"],
        ":color" => $datos["color"],
        ":precio_compra" => $datos["precio_compra"],
        ":precio_venta" => $datos["precio_venta"],
        ":imagen" => $datos["imagen"],
        ":id" => $datos["id"]
    ));

    echo json_encode(array("ok" => true));
}

// ---------- DELETE: eliminar un producto ----------
else if ($metodo === "DELETE") {
    $id = $_GET["id"];

    $consulta = $conexion->prepare("DELETE FROM productos WHERE id = :id");
    $consulta->execute(array(":id" => $id));

    echo json_encode(array("ok" => true));
}
?>

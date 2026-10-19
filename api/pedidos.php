<?php
// =====================================================
// pedidos.php
//   GET  -> devolver todos los pedidos, cada uno con su
//           lista de productos (detalle_pedido) adentro
//   POST -> crear un pedido nuevo con su detalle, y dejar
//           cada prenda como "Reservada" (todavía no es una venta)
//   PUT  -> confirmar el pago de un pedido: pasa a "Pagado",
//           se guarda la fecha de pago, y cada prenda de ese
//           pedido pasa a "Vendida"
// =====================================================

header("Content-Type: application/json");
require "conexion.php";

$metodo = $_SERVER["REQUEST_METHOD"];

require_once "pedidos_funciones.php";

// ---------- GET: listar pedidos con su detalle ----------
if ($metodo === "GET") {
    $consultaPedidos = $conexion->query("SELECT * FROM pedidos ORDER BY id DESC");
    $pedidos = $consultaPedidos->fetchAll(PDO::FETCH_ASSOC);

    // A cada pedido se le agrega su lista de productos comprados
    for ($i = 0; $i < count($pedidos); $i++) {
        $consultaDetalle = $conexion->prepare(
            "SELECT d.id AS detalle_id, d.producto_id AS id, d.producto_nombre AS nombre, d.cantidad,
                    d.precio_venta_unitario AS precio_venta,
                    d.precio_compra_unitario AS precio_compra,
                    d.precio_final,
                    pr.imagen, pr.talla, pr.color
             FROM detalle_pedido d
             LEFT JOIN productos pr ON pr.id = d.producto_id
             WHERE d.pedido_id = :id"
        );
        $consultaDetalle->execute(array(":id" => $pedidos[$i]["id"]));
        $pedidos[$i]["productos"] = $consultaDetalle->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($pedidos);
}

// ---------- POST: crear un pedido nuevo ----------
else if ($metodo === "POST") {
    $datos = json_decode(file_get_contents("php://input"), true);

    // 1) Revisar que ese lugar+fecha+hora siga libre
    $consultaVerificar = $conexion->prepare(
        "SELECT COUNT(*) FROM pedidos WHERE lugar = :lugar AND fecha = :fecha AND hora = :hora"
    );
    $consultaVerificar->execute(array(
        ":lugar" => $datos["lugar"],
        ":fecha" => $datos["fecha"],
        ":hora" => $datos["hora"]
    ));

    if ($consultaVerificar->fetchColumn() > 0) {
        echo json_encode(array("error" => "horario_ocupado"));
        exit;
    }

    // 2) Revisar que todas las prendas del carrito sigan "Disponible"
    //    (puede que otro cliente las haya reservado justo antes)
    $productosPedido = $datos["productos"];
    for ($i = 0; $i < count($productosPedido); $i++) {
        $consultaEstado = $conexion->prepare("SELECT estado_inventario FROM productos WHERE id = :id");
        $consultaEstado->execute(array(":id" => $productosPedido[$i]["id"]));
        $estadoActual = $consultaEstado->fetchColumn();

        if ($estadoActual !== "Disponible") {
            echo json_encode(array(
                "error" => "producto_no_disponible",
                "producto" => $productosPedido[$i]["nombre"]
            ));
            exit;
        }
    }

    $conexion->beginTransaction();

    $sqlPedido = "INSERT INTO pedidos (cliente, whatsapp, lugar, fecha, hora, total, estado)
                  VALUES (:cliente, :whatsapp, :lugar, :fecha, :hora, :total, 'Pendiente')";
    $consultaPedido = $conexion->prepare($sqlPedido . " RETURNING id");
    $consultaPedido->execute(array(
        ":cliente" => $datos["cliente"],
        ":whatsapp" => $datos["whatsapp"],
        ":lugar" => $datos["lugar"],
        ":fecha" => $datos["fecha"],
        ":hora" => $datos["hora"],
        ":total" => $datos["total"]
    ));

    $idPedido = $consultaPedido->fetchColumn();
    $consultaPedido->closeCursor(); // cerrar la consulta antes de seguir (necesario en SQLite)

    for ($i = 0; $i < count($productosPedido); $i++) {
        $item = $productosPedido[$i];

        $sqlDetalle = "INSERT INTO detalle_pedido
                        (pedido_id, producto_id, producto_nombre, cantidad, precio_venta_unitario, precio_compra_unitario)
                        VALUES (:pedido_id, :producto_id, :producto_nombre, :cantidad, :precio_venta, :precio_compra)";
        $consultaDetalle = $conexion->prepare($sqlDetalle);
        $consultaDetalle->execute(array(
            ":pedido_id" => $idPedido,
            ":producto_id" => $item["id"],
            ":producto_nombre" => $item["nombre"],
            ":cantidad" => $item["cantidad"],
            ":precio_venta" => $item["precio_venta"],
            ":precio_compra" => $item["precio_compra"]
        ));

        // La prenda queda "Reservada": ya no es una venta, pero
        // tampoco se muestra en el catálogo público mientras el
        // administrador revisa el pago.
        $sqlReservar = "UPDATE productos SET estado_inventario = 'Reservada' WHERE id = :id";
        $consultaReservar = $conexion->prepare($sqlReservar);
        $consultaReservar->execute(array(":id" => $item["id"]));
    }

    $conexion->commit();

    echo json_encode(array("id" => $idPedido));
}

// ---------- PUT: confirmar el pago de un pedido ----------
else if ($metodo === "PUT") {
    $datos = json_decode(file_get_contents("php://input"), true);

    // Acción 1: guardar el PRECIO FINAL de una prenda ya vendida.
    // Solo se permite una vez: si ya tiene precio final, queda bloqueado.
    if (isset($datos["accion"]) && $datos["accion"] === "precio_final") {
        $precio = floatval($datos["precio_final"]);
        if ($precio < 0) {
            echo json_encode(array("error" => "precio_invalido"));
            exit;
        }
        $consulta = $conexion->prepare(
            "UPDATE detalle_pedido SET precio_final = :precio
             WHERE id = :id AND precio_final IS NULL
               AND pedido_id IN (SELECT id FROM pedidos WHERE estado = 'Pagado')"
        );
        $consulta->execute(array(":precio" => $precio, ":id" => $datos["detalle_id"]));
        if ($consulta->rowCount() === 0) {
            echo json_encode(array("error" => "bloqueado"));
        } else {
            echo json_encode(array("ok" => true));
        }
        exit;
    }

    // Acción 2: cancelar la reserva de UNA prenda de un pedido pendiente:
    // la prenda vuelve a Disponible, se quita del pedido, se recalcula
    // el total, y si el pedido se queda sin prendas se elimina (el
    // horario de entrega queda libre otra vez).
    if (isset($datos["accion"]) && $datos["accion"] === "cancelar_reserva") {
        cancelarReservaDetalle($conexion, $datos["detalle_id"]);
        echo json_encode(array("ok" => true));
        exit;
    }

    $conexion->beginTransaction();

    $sqlPedido = "UPDATE pedidos SET estado = 'Pagado', fecha_pago = " . sqlAhora() . " WHERE id = :id AND estado = 'Pendiente'";
    $consultaPedido = $conexion->prepare($sqlPedido);
    $consultaPedido->execute(array(":id" => $datos["id"]));

    // Cada prenda que estaba en este pedido pasa de "Reservada" a
    // "Vendida": recién ahora se considera una venta definitiva.
    $consultaItems = $conexion->prepare("SELECT producto_id FROM detalle_pedido WHERE pedido_id = :id");
    $consultaItems->execute(array(":id" => $datos["id"]));
    $items = $consultaItems->fetchAll(PDO::FETCH_ASSOC);

    for ($i = 0; $i < count($items); $i++) {
        $sqlVender = "UPDATE productos SET estado_inventario = 'Vendida' WHERE id = :id";
        $consultaVender = $conexion->prepare($sqlVender);
        $consultaVender->execute(array(":id" => $items[$i]["producto_id"]));
    }

    $conexion->commit();

    echo json_encode(array("ok" => true));
}
?>

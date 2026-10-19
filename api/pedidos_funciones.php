<?php
// Funciones compartidas por pedidos.php y productos.php
// Quita una prenda de un pedido PENDIENTE y la deja Disponible.
function cancelarReservaDetalle($conexion, $detalleId) {
    $c = $conexion->prepare(
        "SELECT d.pedido_id, d.producto_id FROM detalle_pedido d
         JOIN pedidos p ON p.id = d.pedido_id
         WHERE d.id = :id AND p.estado = 'Pendiente'"
    );
    $c->execute(array(":id" => $detalleId));
    $fila = $c->fetch(PDO::FETCH_ASSOC);
    if (!$fila) { return; }

    $conexion->beginTransaction();
    $conexion->prepare("DELETE FROM detalle_pedido WHERE id = :id")->execute(array(":id" => $detalleId));
    $conexion->prepare("UPDATE productos SET estado_inventario = 'Disponible' WHERE id = :id AND estado_inventario = 'Reservada'")
             ->execute(array(":id" => $fila["producto_id"]));

    $restantes = $conexion->prepare("SELECT COUNT(*) FROM detalle_pedido WHERE pedido_id = :id");
    $restantes->execute(array(":id" => $fila["pedido_id"]));
    if ($restantes->fetchColumn() == 0) {
        $conexion->prepare("DELETE FROM pedidos WHERE id = :id")->execute(array(":id" => $fila["pedido_id"]));
    } else {
        $conexion->prepare(
            "UPDATE pedidos SET total = (SELECT SUM(precio_venta_unitario * cantidad) FROM detalle_pedido WHERE pedido_id = :id) WHERE id = :id"
        )->execute(array(":id" => $fila["pedido_id"]));
    }
    $conexion->commit();
}
?>

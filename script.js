// ===============================================
// DATOS DE CONFIGURACIÓN (edita esto para personalizar)
// ===============================================
var WHATSAPP_NUMERO = "59174108456";
var ADMIN_CLAVE = "gengar2026";

var LUGARES = [
    "Antigua terminal de ómnibuses de Oruro (ex terminal)",
    "Hotel Monarca",
    "Mercado Narciso Campero",
    "Mercado Walter Khon",
    "Mercado Simón Bolívar"
];

// ===============================================
// DATOS DE PRODUCTOS, CARRITO Y PEDIDOS
// ===============================================
// Ya NO son datos fijos: productos y pedidos ahora se traen desde la
// base de datos SQLite a través de los archivos PHP en /api/, usando
// fetch(). Estos arrays empiezan vacíos y se llenan al cargar la página
// (ver cargarProductos() y cargarPedidos() más abajo).
var productos = [];
var pedidos = [];
var carrito = [];   // el carrito SÍ sigue siendo temporal en el navegador,
                     // como antes, hasta que el cliente hace el pedido

// ===============================================
// CONEXIÓN CON LA BASE DE DATOS (fetch + PHP)
// ===============================================
// fetch() es la forma en que JavaScript le pide datos a un archivo PHP
// sin recargar la página. Se usa junto con .then(), que dice "cuando
// llegue la respuesta, haz esto". Es la única forma de lograr que el
// catálogo y el carrito sigan funcionando igual que antes (sin recargar
// la página) pero ahora guardando todo en la base de datos.

// Trae todos los productos desde productos.php y los deja listos para
// que renderProductos() los use exactamente igual que antes.
function cargarProductos() {
    fetch("api/productos.php")
        .then(function (respuesta) { return respuesta.text(); })
        .then(function (texto) {
            // Se lee como texto primero, para poder mostrar el motivo real
            // si el servidor responde algo que no es JSON.
            var datos;
            try {
                datos = JSON.parse(texto);
            } catch (e) {
                throw new Error("El servidor respondió: " + texto.replace(/<[^>]*>/g, " ").substring(0, 200));
            }
            if (!Array.isArray(datos)) {
                throw new Error(datos.error ? datos.error : "respuesta inesperada del servidor");
            }
            document.getElementById("errorCatalogo").classList.add("d-none");
            productos = [];
            for (var i = 0; i < datos.length; i++) {
                var p = datos[i];
                productos.push({
                    id: Number(p.id),
                    nombre: p.nombre,
                    descripcion: p.descripcion,
                    categoria: p.categoria,
                    talla: p.talla,
                    color: p.color,
                    precioCompra: Number(p.precio_compra),
                    precioVenta: Number(p.precio_venta),
                    estadoInventario: p.estado_inventario,
                    imagen: p.imagen
                });
            }
            renderProductos();
            if (!document.getElementById("panelAdmin").classList.contains("d-none")) {
                renderTablaProductos();
            }
        })
        .catch(function (error) {
            // Si algo falla (Apache apagado, abrir con file://, base de
            // datos vacía...) se muestra un aviso en vez de dejar el
            // catálogo vacío sin explicación.
            var aviso = document.getElementById("errorCatalogo");
            aviso.textContent = "No se pudo cargar el catálogo. Detalle: " + error.message;
            aviso.classList.remove("d-none");
        });
}

// Convierte un enlace normal de Google Drive en un enlace que sí se
// puede usar dentro de <img>. Si no es de Drive, lo deja igual.
function urlImagen(url) {
    if (!url) { return ""; }
    var partes = url.match(/drive\.google\.com\/file\/d\/([^\/?]+)/);
    if (partes) {
        return "https://drive.google.com/thumbnail?id=" + partes[1] + "&sz=w800";
    }
    return url;
}

// Si una imagen de Drive no carga, se prueban otras 2 formas de pedirla
// y, si ninguna funciona, se muestra un cuadro gris con "Sin imagen".
function errorImagen(img) {
    var intento = Number(img.getAttribute("data-intento") || 0);
    var partes = img.src.match(/[?&]id=([^&]+)/) || img.src.match(/googleusercontent\.com\/d\/([^=?\/]+)/);

    if (partes && intento < 2) {
        img.setAttribute("data-intento", intento + 1);
        if (intento === 0) {
            img.src = "https://lh3.googleusercontent.com/d/" + partes[1] + "=w800";
        } else {
            img.src = "https://drive.google.com/uc?export=view&id=" + partes[1];
        }
        return;
    }

    img.onerror = null;
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='#e8e2f0'/><text x='50%' y='50%' fill='#6B2FA8' font-family='sans-serif' font-size='24' text-anchor='middle'>Sin imagen</text></svg>");
}

// Trae todos los pedidos (con su detalle de productos) desde pedidos.php
function cargarPedidos(alTerminar) {
    fetch("api/pedidos.php")
        .then(function (respuesta) { return respuesta.json(); })
        .then(function (datos) {
            pedidos = [];
            for (var i = 0; i < datos.length; i++) {
                var ped = datos[i];
                var productosPed = [];
                for (var j = 0; j < ped.productos.length; j++) {
                    var item = ped.productos[j];
                    productosPed.push({
                        id: Number(item.id),
                        nombre: item.nombre,
                        cantidad: Number(item.cantidad),
                        precioVenta: Number(item.precio_venta),
                        precioCompra: Number(item.precio_compra),
                        detalleId: Number(item.detalle_id),
                        precioFinal: (item.precio_final === null || item.precio_final === undefined) ? null : Number(item.precio_final),
                        imagen: item.imagen,
                        talla: item.talla,
                        color: item.color
                    });
                }
                pedidos.push({
                    id: Number(ped.id),
                    cliente: ped.cliente,
                    telefono: ped.whatsapp,
                    productos: productosPed,
                    total: Number(ped.total),
                    lugar: ped.lugar,
                    fecha: ped.fecha,
                    hora: ped.hora,
                    estado: ped.estado,
                    fechaPago: ped.fecha_pago
                });
            }
            if (!document.getElementById("vistaAdmin").classList.contains("d-none")) {
                renderPedidosAdmin();
                renderReservas();
                renderVentas();
            }
            if (alTerminar) {
                alTerminar();
            }
        });
}

// ===============================================
// FUNCIONES DE AYUDA
// ===============================================
function buscarProducto(id) {
    for (var i = 0; i < productos.length; i++) {
        if (productos[i].id === id) {
            return productos[i];
        }
    }
    return null;
}

function pad(numero) {
    if (numero < 10) {
        return "0" + numero;
    }
    return "" + numero;
}

// ===============================================
// CATÁLOGO
// ===============================================
function renderProductos() {
    var texto = document.getElementById("buscador").value.toLowerCase();
    var categoria = document.getElementById("filtroCategoria").value;
    var contenedor = document.getElementById("listaProductos");
    var sinResultados = document.getElementById("sinResultados");
    contenedor.innerHTML = "";

    var encontrados = 0;

    for (var i = 0; i < productos.length; i++) {
        var p = productos[i];

        // Las prendas Reservadas o Vendidas ya no se muestran en el
        // catálogo público: cada una es única, así que mientras no
        // está "Disponible" simplemente no aparece (no se usa un
        // texto de "agotado", porque no es una tienda con varias
        // unidades de cada producto).
        if (p.estadoInventario !== "Disponible") {
            continue;
        }

        var coincideTexto = p.nombre.toLowerCase().indexOf(texto) !== -1;
        var coincideCategoria = (categoria === "Todos" || p.categoria === categoria);

        if (coincideTexto && coincideCategoria) {
            encontrados++;

            var html = '<div class="col-6 col-lg-3">';
            html += '<div class="card tarjeta-producto position-relative">';
            html += '<img src="' + urlImagen(p.imagen) + '" referrerpolicy="no-referrer" onerror="errorImagen(this)" alt="' + p.nombre + '">';
            html += '<div class="card-body">';
            html += '<h6 class="fw-bold mb-1">' + p.nombre + '</h6>';
            html += '<p class="small text-muted mb-1">' + p.descripcion + '</p>';
            html += '<p class="small text-muted mb-2">Talla ' + p.talla + ' - ' + p.color + '</p>';
            html += '<p class="precio-venta mb-2">Bs ' + p.precioVenta.toFixed(2) + '</p>';
            html += '<button class="btn btn-lima btn-sm w-100" onclick="agregarAlCarrito(' + p.id + ')"><i class="bi bi-bag-plus"></i> Agregar</button>';
            html += '</div></div></div>';

            contenedor.innerHTML += html;
        }
    }

    var vacio = document.getElementById("catalogoVacio");
    var hayDisponibles = false;
    for (var d = 0; d < productos.length; d++) {
        if (productos[d].estadoInventario === "Disponible") { hayDisponibles = true; }
    }

    if (!hayDisponibles) {
        // No hay ninguna prenda cargada o disponible
        vacio.classList.remove("d-none");
        sinResultados.classList.add("d-none");
    } else if (encontrados === 0) {
        vacio.classList.add("d-none");
        sinResultados.classList.remove("d-none");
    } else {
        vacio.classList.add("d-none");
        sinResultados.classList.add("d-none");
    }
}

// ===============================================
// CARRITO
// ===============================================
function agregarAlCarrito(id) {
    var producto = buscarProducto(id);
    if (producto === null || producto.estadoInventario !== "Disponible") {
        return;
    }

    // Cada prenda es única: no tiene sentido "aumentar la cantidad"
    // de un producto que solo existe en 1 unidad. Si ya está en el
    // carrito, no se vuelve a agregar.
    for (var i = 0; i < carrito.length; i++) {
        if (carrito[i].id === id) {
            alert("Esa prenda ya está en tu carrito.");
            return;
        }
    }

    carrito.push({ id: id, cantidad: 1 });
    renderCarrito();
    alert(producto.nombre + " agregado al carrito.");
}

function quitarDelCarrito(id) {
    var nuevoCarrito = [];
    for (var i = 0; i < carrito.length; i++) {
        if (carrito[i].id !== id) {
            nuevoCarrito.push(carrito[i]);
        }
    }
    carrito = nuevoCarrito;
    renderCarrito();
}

function vaciarCarrito() {
    carrito = [];
    renderCarrito();
}

function renderCarrito() {
    var contenedor = document.getElementById("listaCarrito");
    var resumen = document.getElementById("resumenCarrito");
    var vacioTexto = document.getElementById("carritoVacio");
    var contador = document.getElementById("contadorCarrito");

    contenedor.innerHTML = "";
    var totalItems = 0;
    var total = 0;

    for (var i = 0; i < carrito.length; i++) {
        var producto = buscarProducto(carrito[i].id);
        var subtotal = producto.precioVenta * carrito[i].cantidad;
        total = total + subtotal;
        totalItems = totalItems + carrito[i].cantidad;

        var html = '<div class="d-flex align-items-center gap-2 mb-3">';
        html += '<img src="' + urlImagen(producto.imagen) + '" referrerpolicy="no-referrer" onerror="errorImagen(this)" style="width:55px;height:65px;object-fit:cover;border-radius:8px;">';
        html += '<div class="flex-grow-1">';
        html += '<p class="mb-0 small fw-bold">' + producto.nombre + '</p>';
        html += '<p class="mb-1 small text-muted">Bs ' + producto.precioVenta.toFixed(2) + '</p>';
        html += '<button class="btn btn-sm btn-link text-danger ps-0" onclick="quitarDelCarrito(' + producto.id + ')"><i class="bi bi-trash"></i> Quitar</button>';
        html += '</div></div>';

        contenedor.innerHTML += html;
    }

    contador.textContent = totalItems;

    if (carrito.length === 0) {
        vacioTexto.classList.remove("d-none");
        resumen.classList.add("d-none");
    } else {
        vacioTexto.classList.add("d-none");
        resumen.classList.remove("d-none");
        document.getElementById("totalCarrito").textContent = "Bs " + total.toFixed(2);
    }
}

// ===============================================
// HORARIOS DE ENTREGA (con bloqueo de horario ocupado)
// ===============================================
function obtenerHorarios(fechaTexto) {
    var fecha = new Date(fechaTexto + "T00:00:00");
    var dia = fecha.getDay(); // 0 = domingo ... 6 = sábado
    var horarios = [];

    if (dia === 0 || dia === 6) {
        // Sábado y domingo: 9:00 a 19:00
        for (var h = 9; h < 19; h++) {
            horarios.push(pad(h) + ":00 - " + pad(h + 1) + ":00");
        }
    } else {
        // Lunes a viernes: 8:00 a 12:00 y 19:00 a 20:00
        for (var h = 8; h < 12; h++) {
            horarios.push(pad(h) + ":00 - " + pad(h + 1) + ":00");
        }
        horarios.push("19:00 - 20:00");
    }
    return horarios;
}

function actualizarHorarios() {
    var lugar = document.getElementById("pedidoLugar").value;
    var fecha = document.getElementById("pedidoFecha").value;
    var selectHora = document.getElementById("pedidoHora");

    if (lugar === "" || fecha === "") {
        selectHora.innerHTML = '<option value="">Elige fecha y lugar primero...</option>';
        return;
    }

    var todos = obtenerHorarios(fecha);
    var disponibles = [];

    for (var i = 0; i < todos.length; i++) {
        var ocupado = false;
        for (var j = 0; j < pedidos.length; j++) {
            if (pedidos[j].lugar === lugar && pedidos[j].fecha === fecha && pedidos[j].hora === todos[i]) {
                ocupado = true;
            }
        }
        if (ocupado === false) {
            disponibles.push(todos[i]);
        }
    }

    if (disponibles.length === 0) {
        selectHora.innerHTML = '<option value="">No hay horarios libres ese día en ese lugar</option>';
        return;
    }

    selectHora.innerHTML = '<option value="">Selecciona un horario...</option>';
    for (var k = 0; k < disponibles.length; k++) {
        selectHora.innerHTML += '<option value="' + disponibles[k] + '">' + disponibles[k] + '</option>';
    }
}

// ===============================================
// ENVÍO DEL PEDIDO POR WHATSAPP
// ===============================================
function manejarEnvioPedido(evento) {
    evento.preventDefault();

    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    var nombre = document.getElementById("clienteNombre").value;
    var telefono = document.getElementById("clienteWhatsapp").value;
    var lugar = document.getElementById("pedidoLugar").value;
    var fecha = document.getElementById("pedidoFecha").value;
    var hora = document.getElementById("pedidoHora").value;

    if (lugar === "" || fecha === "" || hora === "") {
        alert("Completa el lugar, la fecha y el horario de entrega.");
        return;
    }

    // Verificar de nuevo que el horario siga libre (por si alguien más lo tomó mientras se llenaba el formulario)
    for (var j = 0; j < pedidos.length; j++) {
        if (pedidos[j].lugar === lugar && pedidos[j].fecha === fecha && pedidos[j].hora === hora) {
            alert("Ese horario ya fue reservado por otro cliente. Elige otro.");
            actualizarHorarios();
            return;
        }
    }

    var productosPedido = [];
    var total = 0;

    for (var i = 0; i < carrito.length; i++) {
        var prod = buscarProducto(carrito[i].id);
        var subtotal = prod.precioVenta * carrito[i].cantidad;
        total = total + subtotal;

        productosPedido.push({
            id: prod.id,
            nombre: prod.nombre,
            cantidad: carrito[i].cantidad,
            precio_venta: prod.precioVenta,
            precio_compra: prod.precioCompra
        });
    }

    var pedidoParaGuardar = {
        cliente: nombre,
        whatsapp: telefono,
        lugar: lugar,
        fecha: fecha,
        hora: hora,
        total: total,
        productos: productosPedido
    };

    // Se envía el pedido a pedidos.php, que lo guarda en la base de datos,
    // marca cada prenda como "Reservada" y revisa de nuevo (ya en el
    // servidor) que el horario y las prendas sigan disponibles.
    fetch("api/pedidos.php", {
        method: "POST",
        body: JSON.stringify(pedidoParaGuardar)
    })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function (resultado) {

            if (resultado.error === "horario_ocupado") {
                alert("Ese horario ya fue reservado por otro cliente. Elige otro.");
                cargarPedidos();
                actualizarHorarios();
                return;
            }

            if (resultado.error === "producto_no_disponible") {
                alert("'" + resultado.producto + "' ya fue reservada por otro cliente justo ahora. Vuelve a revisar tu carrito.");
                carrito = [];
                renderCarrito();
                cargarProductos();
                return;
            }

            var idPedido = resultado.id;

            // Armar el texto del mensaje de WhatsApp
            var mensaje = "Hola GENGAR STUDIO! Quiero hacer este pedido:\n\n";
            for (var m = 0; m < productosPedido.length; m++) {
                var item = productosPedido[m];
                mensaje += "- " + item.nombre + " x" + item.cantidad + " = Bs " + (item.precio_venta * item.cantidad).toFixed(2) + "\n";
            }
            mensaje += "\nTotal: Bs " + total.toFixed(2) + "\n";
            mensaje += "Lugar de entrega: " + lugar + "\n";
            mensaje += "Fecha: " + fecha + " - Horario: " + hora + "\n";
            mensaje += "Pedido N°: " + idPedido;

            // encodeURIComponent convierte el texto normal en un formato que puede viajar dentro de una URL
            var link = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensaje);
            window.open(link, "_blank");

            // Reiniciar el carrito y el formulario
            carrito = [];
            renderCarrito();
            document.getElementById("formPedido").reset();

            var modalPedido = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
            modalPedido.hide();

            // Volver a cargar productos (para que desaparezca del catálogo) y pedidos
            cargarProductos();
            cargarPedidos();

            alert("Pedido enviado. Coordina el pago y la entrega por WhatsApp.");
        });
}

// ===============================================
// CAMBIO ENTRE VISTA TIENDA Y VISTA ADMIN
// ===============================================
function mostrarAdmin() {
    document.getElementById("vistaTienda").classList.add("d-none");
    document.getElementById("vistaAdmin").classList.remove("d-none");
    window.scrollTo(0, 0);
}

function mostrarTienda() {
    document.getElementById("vistaAdmin").classList.add("d-none");
    document.getElementById("vistaTienda").classList.remove("d-none");
    document.getElementById("panelAdmin").classList.add("d-none");
    document.getElementById("loginAdmin").classList.remove("d-none");
    document.getElementById("claveAdmin").value = "";
    document.getElementById("errorClave").classList.add("d-none");
}

function manejarLoginAdmin(evento) {
    evento.preventDefault();
    var clave = document.getElementById("claveAdmin").value;

    if (clave === ADMIN_CLAVE) {
        document.getElementById("loginAdmin").classList.add("d-none");
        document.getElementById("panelAdmin").classList.remove("d-none");
        renderTablaProductos();
        renderPedidosAdmin();
        renderReservas();
        renderVentas();
    } else {
        document.getElementById("errorClave").classList.remove("d-none");
    }
}

// ===============================================
// ADMIN: PRODUCTOS
// ===============================================
function renderTablaProductos() {
    var tabla = document.getElementById("tablaProductos");
    tabla.innerHTML = "";

    for (var i = 0; i < productos.length; i++) {
        var p = productos[i];
        var ganancia = p.precioVenta - p.precioCompra;

        var colorBadge = "bg-success"; // Disponible
        if (p.estadoInventario === "Reservada") {
            colorBadge = "bg-warning text-dark";
        } else if (p.estadoInventario === "Vendida") {
            colorBadge = "bg-secondary";
        }

        var fila = "<tr>";
        fila += "<td><img src='" + urlImagen(p.imagen) + "' referrerpolicy='no-referrer' onerror='errorImagen(this)'></td>";
        fila += "<td>" + p.nombre + "</td>";
        fila += "<td>Bs " + p.precioCompra.toFixed(2) + "</td>";
        fila += "<td>Bs " + p.precioVenta.toFixed(2) + "</td>";
        fila += "<td class='text-success'>Bs " + ganancia.toFixed(2) + "</td>";
        fila += "<td><span class='badge " + colorBadge + "'>" + p.estadoInventario + "</span></td>";
        fila += "<td>";
        fila += "<button class='btn btn-sm btn-outline-secondary me-1' onclick='editarProducto(" + p.id + ")'><i class='bi bi-pencil'></i></button>";
        if (p.estadoInventario !== "Disponible") {
            fila += "<button class='btn btn-sm btn-outline-success me-1' onclick='liberarProducto(" + p.id + ")' title='Volver a poner disponible'><i class='bi bi-unlock'></i></button>";
        }
        fila += "<button class='btn btn-sm btn-outline-danger' onclick='eliminarProducto(" + p.id + ")'><i class='bi bi-trash'></i></button>";
        fila += "</td>";
        fila += "</tr>";

        tabla.innerHTML += fila;
    }
}

function liberarProducto(id) {
    fetch("api/productos.php", {
        method: "PUT",
        body: JSON.stringify({ id: id, accion: "liberar" })
    })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function () {
            cargarProductos();
        });
}

function manejarGuardarProducto(evento) {
    evento.preventDefault();

    var id = document.getElementById("productoId").value;
    var nombre = document.getElementById("pNombre").value;
    var descripcion = document.getElementById("pDescripcion").value;
    var categoria = document.getElementById("pCategoria").value;
    var talla = document.getElementById("pTalla").value;
    var color = document.getElementById("pColor").value;
    var compra = parseFloat(document.getElementById("pCompra").value);
    var venta = parseFloat(document.getElementById("pVenta").value);
    var imagen = document.getElementById("pImagen").value;

    var productoParaGuardar = {
        nombre: nombre,
        descripcion: descripcion,
        categoria: categoria,
        talla: talla,
        color: color,
        precio_compra: compra,
        precio_venta: venta,
        imagen: imagen
    };

    if (id === "") {
        // Es un producto nuevo: se envía con POST
        fetch("api/productos.php", {
            method: "POST",
            body: JSON.stringify(productoParaGuardar)
        })
            .then(function (respuesta) { return respuesta.json(); })
            .then(function () {
                cancelarEdicionProducto();
                cargarProductos();
            });
    } else {
        // Es una edición: se envía con PUT, incluyendo el id
        productoParaGuardar.id = parseInt(id);
        fetch("api/productos.php", {
            method: "PUT",
            body: JSON.stringify(productoParaGuardar)
        })
            .then(function (respuesta) { return respuesta.json(); })
            .then(function () {
                cancelarEdicionProducto();
                cargarProductos();
            });
    }
}

function editarProducto(id) {
    var producto = buscarProducto(id);

    document.getElementById("productoId").value = producto.id;
    document.getElementById("pNombre").value = producto.nombre;
    document.getElementById("pDescripcion").value = producto.descripcion;
    document.getElementById("pCategoria").value = producto.categoria;
    document.getElementById("pTalla").value = producto.talla;
    document.getElementById("pColor").value = producto.color;
    document.getElementById("pCompra").value = producto.precioCompra;
    document.getElementById("pVenta").value = producto.precioVenta;
    document.getElementById("pImagen").value = producto.imagen;

    document.getElementById("tituloFormProducto").textContent = "Editando: " + producto.nombre;
    document.getElementById("btnCancelarEdicion").classList.remove("d-none");
    window.scrollTo(0, 0);
}

function cancelarEdicionProducto() {
    document.getElementById("formProducto").reset();
    document.getElementById("productoId").value = "";
    document.getElementById("tituloFormProducto").textContent = "Nuevo producto";
    document.getElementById("btnCancelarEdicion").classList.add("d-none");
}

function eliminarProducto(id) {
    var confirmar = confirm("¿Seguro que quieres eliminar este producto?");
    if (confirmar === false) {
        return;
    }

    fetch("api/productos.php?id=" + id, { method: "DELETE" })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function () {
            cargarProductos();
        });
}

// ===============================================
// ADMIN: PEDIDOS Y PAGOS
// ===============================================
function renderPedidosAdmin() {
    var contenedor = document.getElementById("listaPedidosAdmin");
    var sinPedidos = document.getElementById("sinPedidos");
    contenedor.innerHTML = "";

    if (pedidos.length === 0) {
        sinPedidos.classList.remove("d-none");
        return;
    }
    sinPedidos.classList.add("d-none");

    for (var i = 0; i < pedidos.length; i++) {
        var ped = pedidos[i];

        var html = '<div class="card card-gengar p-3 mb-3">';
        html += '<div class="d-flex justify-content-between flex-wrap gap-2">';
        html += '<div>';
        html += '<p class="fw-bold mb-1">Pedido #' + ped.id + ' - ' + ped.cliente + '</p>';
        html += '<p class="small text-muted mb-1">WhatsApp: ' + ped.telefono + '</p>';
        html += '<p class="small text-muted mb-1">' + ped.productos.length + ' producto(s) - Bs ' + ped.total.toFixed(2) + '</p>';
        html += '<p class="small text-muted mb-0"><i class="bi bi-geo-alt"></i> ' + ped.lugar + ' - ' + ped.fecha + ' - ' + ped.hora + '</p>';
        html += '</div>';
        html += '<div class="text-end">';

        if (ped.estado === "Pagado") {
            html += '<span class="badge bg-success mb-2">Pagado</span><br>';
            html += '<button class="btn btn-sm btn-lima" onclick="generarRecibo(' + ped.id + ')">Generar recibo</button>';
        } else {
            html += '<span class="badge bg-warning text-dark mb-2">Pendiente</span><br>';
            html += '<button class="btn btn-sm btn-outline-success" onclick="confirmarPago(' + ped.id + ')">Confirmar pago</button>';
        }

        html += '</div></div></div>';
        contenedor.innerHTML += html;
    }
}

function confirmarPago(id) {
    fetch("api/pedidos.php", {
        method: "PUT",
        body: JSON.stringify({ id: id })
    })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function () {
            cargarProductos();
            cargarPedidos();
        });
}

function generarRecibo(id) {
    var pedido = null;
    for (var i = 0; i < pedidos.length; i++) {
        if (pedidos[i].id === id) {
            pedido = pedidos[i];
        }
    }
    if (pedido === null) {
        return;
    }

    var html = '<p><strong>GENGAR STUDIO</strong> - Recibo de compra</p>';
    html += '<p class="small text-muted">Pedido N°: ' + pedido.id + ' - Fecha: ' + pedido.fecha + '</p>';
    html += '<p class="small">Cliente: ' + pedido.cliente + ' (' + pedido.telefono + ')</p>';
    html += '<table class="table table-sm mt-3"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>';

    for (var i = 0; i < pedido.productos.length; i++) {
        var item = pedido.productos[i];
        var subtotal = item.precioVenta * item.cantidad;
        html += '<tr><td>' + item.nombre + '</td><td>' + item.cantidad + '</td><td>Bs ' + item.precioVenta.toFixed(2) + '</td><td>Bs ' + subtotal.toFixed(2) + '</td></tr>';
    }

    html += '</tbody></table>';
    html += '<p class="fw-bold fs-5">Total: Bs ' + pedido.total.toFixed(2) + '</p>';
    html += '<p class="small text-muted">Lugar de entrega: ' + pedido.lugar + '<br>Horario: ' + pedido.hora + '</p>';
    html += '<p class="small text-success fw-bold">Estado: Pagado</p>';

    document.getElementById("contenidoRecibo").innerHTML = html;

    var modalRecibo = new bootstrap.Modal(document.getElementById("modalRecibo"));
    modalRecibo.show();
}

// ===============================================
// ADMIN: RESERVAS
// Una tarjeta por cada prenda de un pedido todavía "Pendiente".
// ===============================================
function cancelarReserva(detalleId) {
    if (!confirm("¿Cancelar esta reserva? La prenda volverá al catálogo.")) {
        return;
    }
    fetch("api/pedidos.php", {
        method: "PUT",
        body: JSON.stringify({ accion: "cancelar_reserva", detalle_id: detalleId })
    })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function () {
            cargarProductos();
            cargarPedidos();
        });
}

function renderReservas() {
    var contenedor = document.getElementById("listaReservas");
    var sinReservas = document.getElementById("sinReservas");
    contenedor.innerHTML = "";

    var cantidad = 0;

    for (var i = 0; i < pedidos.length; i++) {
        var ped = pedidos[i];
        if (ped.estado !== "Pendiente") {
            continue;
        }

        for (var j = 0; j < ped.productos.length; j++) {
            var item = ped.productos[j];
            cantidad++;

            var html = '<div class="col-6 col-lg-3"><div class="card tarjeta-admin">';
            html += '<img src="' + urlImagen(item.imagen) + '" referrerpolicy="no-referrer" onerror="errorImagen(this)" alt="' + item.nombre + '">';
            html += '<div class="card-body">';
            html += '<h6 class="fw-bold mb-1">' + item.nombre + '</h6>';
            html += '<p class="small text-muted mb-1">Talla ' + item.talla + ' - ' + item.color + '</p>';
            html += '<p class="precio-venta mb-2">Bs ' + item.precioVenta.toFixed(2) + '</p>';
            html += '<p class="small mb-1"><strong>' + ped.cliente + '</strong> - ' + ped.telefono + '</p>';
            html += '<p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ' + ped.lugar + '<br>' + ped.fecha + ' - ' + ped.hora + '</p>';
            html += '<div class="zona-acciones">';
            html += '<button class="btn btn-sm btn-lima w-100 mb-2" onclick="confirmarPago(' + ped.id + ')"><i class="bi bi-check2-circle"></i> Confirmar pago</button>';
            html += '<button class="btn btn-sm btn-outline-danger w-100" onclick="cancelarReserva(' + item.detalleId + ')"><i class="bi bi-x-circle"></i> Cancelar reserva</button>';
            html += '</div></div></div></div>';

            contenedor.innerHTML += html;
        }
    }

    if (cantidad === 0) {
        sinReservas.classList.remove("d-none");
    } else {
        sinReservas.classList.add("d-none");
    }
}

// ===============================================
// ADMIN: VENTAS Y GANANCIAS
// ===============================================
function tarjetaResumen(titulo, valor) {
    return '<div class="col-md-4"><div class="card card-gengar p-4 text-center"><p class="text-muted mb-1">' + titulo + '</p><p class="fs-3 fw-bold mb-0">' + valor + '</p></div></div>';
}

var NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Convierte "2026-10" en "Octubre 2026"
function nombreMes(clave) {
    var partes = clave.split("-");
    return NOMBRES_MESES[parseInt(partes[1], 10) - 1] + " " + partes[0];
}

// Fecha de hoy como "2026-10" (mes actual)
function claveMesActual() {
    var hoy = new Date();
    return hoy.getFullYear() + "-" + pad(hoy.getMonth() + 1);
}

// Arma una lista con TODAS las prendas vendidas (pedidos Pagados).
// Cada prenda guarda su mes (AAAA-MM) según la fecha en que se confirmó el pago.
function listarVendidas() {
    var lista = [];
    for (var i = 0; i < pedidos.length; i++) {
        if (pedidos[i].estado !== "Pagado") {
            continue;
        }
        var fechaVenta = pedidos[i].fechaPago ? pedidos[i].fechaPago : pedidos[i].fecha;
        for (var j = 0; j < pedidos[i].productos.length; j++) {
            var item = pedidos[i].productos[j];
            lista.push({
                item: item,
                fecha: fechaVenta,
                mes: fechaVenta.substring(0, 7),
                anio: fechaVenta.substring(0, 4)
            });
        }
    }
    return lista;
}

function guardarPrecioFinal(detalleId) {
    var campo = document.getElementById("precioFinal" + detalleId);
    var valor = campo.value;
    if (valor === "" || Number(valor) < 0) {
        alert("Escribe un precio final válido.");
        return;
    }
    if (!confirm("Una vez guardado el precio final de Bs " + Number(valor).toFixed(2) + " ya NO se podrá editar. ¿Guardar?")) {
        return;
    }
    fetch("api/pedidos.php", {
        method: "PUT",
        body: JSON.stringify({ accion: "precio_final", detalle_id: detalleId, precio_final: Number(valor) })
    })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function (datos) {
            if (datos.error) {
                alert("Ese precio ya estaba bloqueado.");
            }
            cargarPedidos();
        });
}

function renderVentas() {
    var vendidas = listarVendidas();

    // ----- Tarjetas de prendas vendidas -----
    var contenedor = document.getElementById("listaVendidas");
    var sinVendidas = document.getElementById("sinVendidas");
    contenedor.innerHTML = "";

    for (var i = 0; i < vendidas.length; i++) {
        var item = vendidas[i].item;

        var html = '<div class="col-6 col-lg-3"><div class="card tarjeta-admin">';
        html += '<img src="' + urlImagen(item.imagen) + '" referrerpolicy="no-referrer" onerror="errorImagen(this)" alt="' + item.nombre + '">';
        html += '<div class="card-body">';
        html += '<h6 class="fw-bold mb-1">' + item.nombre + '</h6>';
        html += '<p class="small text-muted mb-1">Talla ' + item.talla + ' - ' + item.color + '</p>';
        html += '<p class="small text-muted mb-1">Compra: Bs ' + item.precioCompra.toFixed(2) + ' - Publicado: Bs ' + item.precioVenta.toFixed(2) + '</p>';
        html += '<p class="small text-muted mb-2">Vendida: ' + vendidas[i].fecha + '</p>';
        html += '<div class="zona-acciones">';

        if (item.precioFinal === null) {
            html += '<label class="small fw-bold">Precio final de venta (Bs)</label>';
            html += '<input type="number" min="0" step="0.5" id="precioFinal' + item.detalleId + '" class="form-control form-control-sm mb-2" value="' + item.precioVenta + '">';
            html += '<button class="btn btn-sm btn-lima w-100" onclick="guardarPrecioFinal(' + item.detalleId + ')"><i class="bi bi-lock"></i> Guardar y bloquear</button>';
        } else {
            var ganancia = (item.precioFinal - item.precioCompra) * item.cantidad;
            html += '<p class="mb-1 fw-bold"><i class="bi bi-lock-fill text-success"></i> Precio final: Bs ' + item.precioFinal.toFixed(2) + '</p>';
            html += '<p class="mb-0 text-success fw-bold">Ganancia: Bs ' + ganancia.toFixed(2) + '</p>';
        }

        html += '</div></div></div></div>';
        contenedor.innerHTML += html;
    }

    if (vendidas.length === 0) {
        sinVendidas.classList.remove("d-none");
    } else {
        sinVendidas.classList.add("d-none");
    }

    // ----- Totales por mes y por año (solo prendas con precio final) -----
    var meses = {};
    var anios = {};

    for (var k = 0; k < vendidas.length; k++) {
        var v = vendidas[k];
        if (!meses[v.mes]) { meses[v.mes] = { cantidad: 0, ingresos: 0, ganancia: 0, pendientes: 0 }; }
        if (!anios[v.anio]) { anios[v.anio] = { cantidad: 0, ingresos: 0, ganancia: 0 }; }

        if (v.item.precioFinal === null) {
            meses[v.mes].pendientes++;
        } else {
            var ing = v.item.precioFinal * v.item.cantidad;
            var gan = (v.item.precioFinal - v.item.precioCompra) * v.item.cantidad;
            meses[v.mes].cantidad += v.item.cantidad;
            meses[v.mes].ingresos += ing;
            meses[v.mes].ganancia += gan;
            anios[v.anio].cantidad += v.item.cantidad;
            anios[v.anio].ingresos += ing;
            anios[v.anio].ganancia += gan;
        }
    }

    // El mes actual siempre aparece (en 0 si todavía no hay ventas):
    // así "se reinicia" cada mes sin borrar los meses anteriores.
    var mesHoy = claveMesActual();
    if (!meses[mesHoy]) { meses[mesHoy] = { cantidad: 0, ingresos: 0, ganancia: 0, pendientes: 0 }; }
    var anioHoy = mesHoy.substring(0, 4);
    if (!anios[anioHoy]) { anios[anioHoy] = { cantidad: 0, ingresos: 0, ganancia: 0 }; }

    var claves = Object.keys(meses).sort().reverse();
    var cuerpoMeses = document.getElementById("tablaMeses");
    cuerpoMeses.innerHTML = "";
    for (var m = 0; m < claves.length; m++) {
        var d = meses[claves[m]];
        var etiqueta = nombreMes(claves[m]) + (claves[m] === mesHoy ? ' <span class="badge bg-success">Mes actual</span>' : "");
        var fila = "<tr><td>" + etiqueta + "</td><td>" + d.cantidad + "</td><td>Bs " + d.ingresos.toFixed(2) + "</td><td class='text-success'>Bs " + d.ganancia.toFixed(2) + "</td><td>" + d.pendientes + "</td></tr>";
        cuerpoMeses.innerHTML += fila;
    }

    // Tarjetas del mes actual
    var actual = meses[mesHoy];
    var resumen = '<div class="row g-3">';
    resumen += tarjetaResumen("Prendas vendidas en " + nombreMes(mesHoy), actual.cantidad);
    resumen += tarjetaResumen("Ingresos del mes", "Bs " + actual.ingresos.toFixed(2));
    resumen += tarjetaResumen("Ganancia del mes", "Bs " + actual.ganancia.toFixed(2));
    resumen += '</div>';
    document.getElementById("mesActual").innerHTML = resumen;

    // Resumen por año: un año queda "Cerrado" cuando ya terminó (pasaron sus 12 meses)
    var clavesAnios = Object.keys(anios).sort().reverse();
    var cuerpoAnios = document.getElementById("tablaAnios");
    cuerpoAnios.innerHTML = "";
    for (var a = 0; a < clavesAnios.length; a++) {
        var da = anios[clavesAnios[a]];
        var estado = (clavesAnios[a] === anioHoy) ? '<span class="badge bg-success">En curso</span>' : '<span class="badge bg-secondary">Cerrado</span>';
        cuerpoAnios.innerHTML += "<tr><td>" + clavesAnios[a] + "</td><td>" + estado + "</td><td>" + da.cantidad + "</td><td>Bs " + da.ingresos.toFixed(2) + "</td><td class='text-success'>Bs " + da.ganancia.toFixed(2) + "</td></tr>";
    }
}

// ===============================================
// INICIO: se ejecuta cuando la página termina de cargar
// ===============================================
document.addEventListener("DOMContentLoaded", function () {

    // Llenar el select de lugares de entrega con el array LUGARES
    var selectLugar = document.getElementById("pedidoLugar");
    for (var i = 0; i < LUGARES.length; i++) {
        selectLugar.innerHTML += '<option value="' + LUGARES[i] + '">' + LUGARES[i] + '</option>';
    }

    // Antes se llamaba renderProductos() directo sobre el array fijo.
    // Ahora se pide primero a la base de datos con cargarProductos()/
    // cargarPedidos(), y esas funciones son las que llaman a renderProductos()
    // cuando la respuesta llega.
    cargarProductos();
    cargarPedidos();
    renderCarrito();

    // Cada vez que se abre el formulario de pedido se vuelven a pedir los
    // pedidos a la base de datos, para que los horarios ocupados por otros
    // clientes (o liberados por el admin) estén siempre actualizados.
    document.getElementById("modalPedido").addEventListener("show.bs.modal", function () {
        cargarPedidos(actualizarHorarios);
    });

    document.getElementById("buscador").addEventListener("input", renderProductos);
    document.getElementById("filtroCategoria").addEventListener("change", renderProductos);
    document.getElementById("formPedido").addEventListener("submit", manejarEnvioPedido);
    document.getElementById("formLoginAdmin").addEventListener("submit", manejarLoginAdmin);
    document.getElementById("formProducto").addEventListener("submit", manejarGuardarProducto);

});

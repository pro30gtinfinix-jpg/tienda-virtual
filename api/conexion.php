<?php
// =====================================================
// conexion.php
// Abre la conexión con la base de datos usando PDO.
// - Si existe la variable DATABASE_URL (Render / Neon) se usa
//   PostgreSQL: los datos quedan guardados de forma permanente
//   fuera del servidor web.
// - Si no existe, se usa SQLite (archivo .db), por ejemplo en
//   XAMPP en tu computador.
// Todos los demás archivos PHP incluyen este con
// require "conexion.php"; para obtener $conexion.
// =====================================================

// Nunca mostrar errores de PHP como HTML: la página espera siempre JSON.
ini_set("display_errors", "0");

$urlBase = getenv("DATABASE_URL");

// Limpiar lo que se pegó en DATABASE_URL: a veces se copia con
// comillas, con "psql" delante o con "DATABASE_URL=". Se queda solo
// con la dirección que empieza con postgresql:// o postgres://
if ($urlBase !== false && preg_match('~(postgres(?:ql)?://[^\s\'"]+)~', $urlBase, $encontrada)) {
    $urlBase = $encontrada[1];
}
$esPostgres = ($urlBase !== false && $urlBase !== "");
$rutaBaseDatos = "";

// Fecha y hora actuales (hora de Bolivia) escritas en SQL,
// según el tipo de base de datos.
function sqlAhora() {
    global $esPostgres;
    if ($esPostgres) {
        return "to_char(now() AT TIME ZONE 'America/La_Paz', 'YYYY-MM-DD HH24:MI:SS')";
    }
    return "datetime('now', 'localtime')";
}

try {
    if ($esPostgres) {
        $partes = parse_url($urlBase);
        if ($partes === false || !isset($partes["host"]) || !isset($partes["user"]) || !isset($partes["path"])) {
            throw new Exception("DATABASE_URL no tiene el formato postgresql://usuario:contraseña@servidor/basedatos");
        }
        if (!isset($partes["pass"])) { $partes["pass"] = ""; }
        $dsn = "pgsql:host=" . $partes["host"]
             . ";port=" . (isset($partes["port"]) ? $partes["port"] : 5432)
             . ";dbname=" . ltrim($partes["path"], "/");
        $ssl = "prefer";
        if (isset($partes["query"])) {
            parse_str($partes["query"], $opciones);
            if (isset($opciones["sslmode"])) { $ssl = $opciones["sslmode"]; }
        } else if (strpos($partes["host"], ".") !== false) {
            $ssl = "require"; // dirección externa (con dominio): conexión cifrada
        }
        // connect_timeout: Neon se "duerme" tras 5 min sin uso y tarda
        // un instante en despertar; se le da tiempo para responder.
        $dsn .= ";sslmode=" . $ssl . ";connect_timeout=15";

        $conexion = new PDO($dsn, urldecode($partes["user"]), urldecode($partes["pass"]));
        $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Primera vez: si las tablas no existen, se crean solas.
        $existe = $conexion->query("SELECT to_regclass('public.productos')")->fetchColumn();
        if ($existe === null || $existe === false) {
            $conexion->exec(file_get_contents(__DIR__ . "/../database/esquema_postgres.sql"));
        }
    } else {
        // Por defecto la base está en /database/gengar_studio.db
        $rutaBaseDatos = getenv("DB_PATH") ? getenv("DB_PATH") : __DIR__ . "/../database/gengar_studio.db";

        $esNueva = !file_exists($rutaBaseDatos) || filesize($rutaBaseDatos) === 0;
        if ($esNueva && !is_dir(dirname($rutaBaseDatos))) {
            mkdir(dirname($rutaBaseDatos), 0777, true);
        }

        $conexion = new PDO("sqlite:" . $rutaBaseDatos);
        $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        if ($esNueva) {
            $conexion->exec(file_get_contents(__DIR__ . "/../database/esquema.sql"));
        }

        // Bases antiguas: agregar la columna precio_final si falta
        $columnas = $conexion->query("PRAGMA table_info(detalle_pedido)")->fetchAll(PDO::FETCH_ASSOC);
        $tiene = false;
        for ($i = 0; $i < count($columnas); $i++) {
            if ($columnas[$i]["name"] === "precio_final") { $tiene = true; }
        }
        if (!$tiene && count($columnas) > 0) {
            $conexion->exec("ALTER TABLE detalle_pedido ADD COLUMN precio_final REAL");
        }
    }
} catch (Throwable $error) {
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(array("error" => "No se pudo conectar a la base de datos: " . $error->getMessage()));
    exit;
}
?>

<?php

/**
 * api_uploads.sigurban.com — Storage API
 * Puente HTTP entre el sitio Nuxt de Sig-Urban y el almacenamiento de imágenes/videos en Hostinger.
 * Subir esta carpeta completa a: /home/u466876219/domains/sigurban.com/public_html/api_uploads
 *
 * Los archivos subidos se organizan automáticamente por fecha (igual que WordPress):
 *   /images/<dir-elegido>/<AAAA>/<MM>/archivo.jpg
 *   /videos/<dir-elegido>/<AAAA>/<MM>/archivo.mp4
 *
 * Acciones:
 *   GET  ?action=list&dir=/images           → lista archivos y carpetas
 *   POST ?action=upload&dir=/images         → sube imagen o video (multipart/form-data), se guarda en /images/AAAA/MM/
 *   POST ?action=delete&dir=/images/2026/01&name=x → elimina archivo
 */

define('SECRET_KEY',   getenv('STORAGE_API_KEY') ?: 'sigurban_storage_2026');
define('STORAGE_ROOT', __DIR__);
define('IMAGE_EXTS',   ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp']);
define('VIDEO_EXTS',   ['mp4', 'webm', 'mov']);
define('MAX_UPLOAD_BYTES', 150 * 1024 * 1024); // 150 MB

// ── CORS & headers ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
$allowedOrigins = ['https://www.sigurban.com', 'https://sigurban.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . (in_array($origin, $allowedOrigins, true) ? $origin : 'https://www.sigurban.com'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Api-Key, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Autenticación ─────────────────────────────────────────────────────────────
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== SECRET_KEY) {
    http_response_code(401);
    exit(json_encode(['ok' => false, 'error' => 'Unauthorized']));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitizeDir(string $input): string
{
    $clean = preg_replace('/\.\.+/', '', $input);   // sin traversal
    $clean = '/' . trim($clean, '/');
    return $clean ?: '/images';
}

function fileExt(string $name): string
{
    return strtolower(pathinfo($name, PATHINFO_EXTENSION));
}

function isImage(string $name): bool
{
    return in_array(fileExt($name), IMAGE_EXTS, true);
}

function isVideo(string $name): bool
{
    return in_array(fileExt($name), VIDEO_EXTS, true);
}

function isMedia(string $name): bool
{
    return isImage($name) || isVideo($name);
}

function safeName(string $name): string
{
    return preg_replace('/[^a-zA-Z0-9._-]/', '-', basename($name));
}

// ── Routing ───────────────────────────────────────────────────────────────────
$action   = $_GET['action'] ?? 'list';
$dir      = sanitizeDir($_GET['dir'] ?? '/images');
$fullPath = STORAGE_ROOT . $dir;

// ── LIST ──────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    if (!is_dir($fullPath)) {
        mkdir($fullPath, 0755, true);
    }

    $items       = array_values(array_diff(scandir($fullPath), ['.', '..']));
    $directories = [];
    $files       = [];

    foreach ($items as $item) {
        $itemPath = $fullPath . '/' . $item;
        if (is_dir($itemPath)) {
            $directories[] = [
                'name' => $item,
                'path' => $dir . '/' . $item,
            ];
        } elseif (isMedia($item)) {
            $files[] = [
                'name'      => $item,
                'path'      => $dir . '/' . $item,
                'type'      => isVideo($item) ? 'video' : 'image',
                'size'      => filesize($itemPath),
                'updatedAt' => date('c', filemtime($itemPath)),
            ];
        }
    }

    usort($directories, fn($a, $b) => strcmp($a['name'], $b['name']));
    usort($files,       fn($a, $b) => strcmp($a['name'], $b['name']));

    $parent = dirname($dir);
    $parentDir = ($dir !== '/images' && $parent && $parent !== '.' && $parent !== '/')
        ? $parent
        : null;

    exit(json_encode([
        'ok'          => true,
        'currentDir'  => $dir,
        'parentDir'   => $parentDir,
        'directories' => $directories,
        'files'       => $files,
        'source'      => 'php',
    ]));
}

// ── UPLOAD ────────────────────────────────────────────────────────────────────
// Los archivos se guardan siempre dentro de una subcarpeta AAAA/MM del directorio
// elegido, igual que la estructura de subidas de WordPress.
if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadErr = $_FILES['file']['error'] ?? -1;
    if (!isset($_FILES['file']) || $uploadErr !== UPLOAD_ERR_OK) {
        http_response_code(400);
        exit(json_encode(['ok' => false, 'error' => "Upload error code: $uploadErr"]));
    }

    $file = $_FILES['file'];

    if (!isMedia($file['name'])) {
        http_response_code(400);
        exit(json_encode(['ok' => false, 'error' => 'Tipo de archivo no permitido']));
    }

    if ($file['size'] > MAX_UPLOAD_BYTES) {
        http_response_code(413);
        exit(json_encode(['ok' => false, 'error' => 'El archivo supera el límite de 150 MB']));
    }

    $datedSubdir = date('Y') . '/' . date('m');
    $dir         = rtrim($dir, '/') . '/' . $datedSubdir;
    $fullPath    = STORAGE_ROOT . $dir;

    if (!is_dir($fullPath)) {
        mkdir($fullPath, 0755, true);
    }

    $name       = safeName($file['name']);
    $targetPath = rtrim($fullPath, '/') . '/' . $name;

    // Evita sobreescribir si ya existe un archivo con el mismo nombre ese mes
    if (file_exists($targetPath)) {
        $ext  = fileExt($name);
        $base = pathinfo($name, PATHINFO_FILENAME);
        $name = $base . '-' . substr(md5(uniqid('', true)), 0, 6) . '.' . $ext;
        $targetPath = rtrim($fullPath, '/') . '/' . $name;
    }

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        exit(json_encode(['ok' => false, 'error' => 'No se pudo guardar el archivo']));
    }

    exit(json_encode([
        'ok'   => true,
        'path' => $dir . '/' . $name,
        'name' => $name,
        'type' => isVideo($name) ? 'video' : 'image',
    ]));
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $name       = safeName($_GET['name'] ?? '');
    $targetPath = rtrim($fullPath, '/') . '/' . $name;

    if (!$name || !file_exists($targetPath) || !is_file($targetPath)) {
        http_response_code(404);
        exit(json_encode(['ok' => false, 'error' => 'Archivo no encontrado']));
    }

    unlink($targetPath);
    exit(json_encode(['ok' => true]));
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Acción no reconocida']);

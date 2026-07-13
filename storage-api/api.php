<?php

/**
 * sulafbc.com — Storage API
 * Puente HTTP entre Vercel (Nuxt) y el almacenamiento de imágenes/videos en cPanel.
 * Subir este archivo a: /home/sulafbc/sulafbc_storage/api.php
 *
 * Acciones:
 *   GET  ?action=list&dir=/images           → lista archivos y carpetas
 *   POST ?action=upload&dir=/images         → sube imagen o video (multipart/form-data)
 *   POST ?action=delete&dir=/images&name=x  → elimina archivo
 */

define('SECRET_KEY',   getenv('STORAGE_API_KEY') ?: 'sfb_K9mPxV2026storage');
define('STORAGE_ROOT', __DIR__);
define('IMAGE_EXTS',   ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp']);
define('VIDEO_EXTS',   ['mp4', 'webm', 'mov']);
define('MAX_UPLOAD_BYTES', 120 * 1024 * 1024); // 120 MB, cubre video del hero

// ── CORS & headers ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://sulafbc.com');
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
if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadErr = $_FILES['file']['error'] ?? -1;
    if (!isset($_FILES['file']) || $uploadErr !== UPLOAD_ERR_OK) {
        http_response_code(400);
        exit(json_encode(['ok' => false, 'error' => "Upload error code: $uploadErr"]));
    }

    if (!is_dir($fullPath)) {
        mkdir($fullPath, 0755, true);
    }

    $file = $_FILES['file'];

    if (!isMedia($file['name'])) {
        http_response_code(400);
        exit(json_encode(['ok' => false, 'error' => 'Tipo de archivo no permitido']));
    }

    if ($file['size'] > MAX_UPLOAD_BYTES) {
        http_response_code(413);
        exit(json_encode(['ok' => false, 'error' => 'El archivo supera el límite de 120 MB']));
    }

    $name       = safeName($file['name']);
    $targetPath = rtrim($fullPath, '/') . '/' . $name;

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

<?php
// api/leadscrm.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.sigurban.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Metodo no permitido.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST ?? [];
}

$name  = trim((string)($data['name'] ?? $data['nombre'] ?? ''));
$dni   = preg_replace('/\D+/', '', (string)($data['dni'] ?? $data['identidad'] ?? ''));
$phone = preg_replace('/\D+/', '', (string)($data['phone'] ?? $data['telefono'] ?? ''));

if ($name === '' || $dni === '' || $phone === '') {
  http_response_code(400);
  echo json_encode([
    'ok' => false,
    'message' => 'Faltan campos requeridos. Revisa el formulario e intenta de nuevo.'
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

function isDuplicateProspect(int $httpCode, $decoded): bool {
  if ($httpCode !== 400 || !is_array($decoded)) return false;
  $msg = (string)($decoded['message'] ?? '');
  $m = mb_strtolower($msg, 'UTF-8');

  if (strpos($m, 'ya existe un prospecto') !== false) return true;
  if (strpos($m, 'dni') !== false && strpos($m, 'existe') !== false) return true;
  if (strpos($m, 'duplicate') !== false) return true;
  if (strpos($m, 'duplicado') !== false) return true;

  return false;
}

$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWExY2QwNGYxMjQ4OGY2MGI5ZmQ4OWUiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk4OTE4ODEsImV4cCI6MTk3OTA5MTg4MX0.t3cC6BpxHpbsY9vlo9t0N7LNyeLExmSMx1LGCeLfK3o';

if (!$token) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'message' => 'Token CRM no configurado en el servidor.'
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$payload = json_encode([
  'name'  => $name,
  'dni'   => $dni,
  'phone' => $phone
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.crm.sigurban.com/api/leads/chatbot');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token
  ],
  CURLOPT_TIMEOUT => 20
]);

$responseBody = curl_exec($ch);
$curlErr = curl_error($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($responseBody === false) {
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'message' => 'No se pudo conectar con el CRM.',
    'error' => $curlErr
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$decoded = json_decode($responseBody, true);
$isJson = is_array($decoded);

if ($httpCode >= 200 && $httpCode < 300) {
  echo json_encode([
    'ok' => true,
    'status' => $httpCode,
    'data' => $isJson ? $decoded : $responseBody
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

if (isDuplicateProspect($httpCode, $decoded)) {
  http_response_code(200);
  echo json_encode([
    'ok' => true,
    'exists' => true,
    'status' => $httpCode,
    'message' => 'Ya recibimos tu solicitud de precalificacion. Para darle seguimiento, escribinos por WhatsApp.',
    'data' => $isJson ? $decoded : null
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code($httpCode ?: 502);
echo json_encode([
  'ok' => false,
  'status' => $httpCode,
  'message' => $isJson && !empty($decoded['message']) ? $decoded['message'] : 'Error al crear el lead en CRM.',
  'data' => $isJson ? $decoded : null,
  'raw' => $isJson ? null : $responseBody
], JSON_UNESCAPED_UNICODE);
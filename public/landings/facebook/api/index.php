<?php
/**
 * sigurban.com/landing/facebook/api  (index.php)
 * - Recibe leads (JSON o form-data)
 * - Normaliza: name, dni, phone
 * - Reenvía a n8n webhook (recomendado)
 * - (Opcional) Reenvía directo al CRM
 *
 * IMPORTANTE:
 * - Cambiá N8N_WEBHOOK_URL por tu URL real de n8n (Production URL).
 * - Cambiá API_SECRET por uno largo.
 * - Si activás envío directo a CRM, poné el token del CRM en CRM_BEARER_TOKEN.
 */

header('Content-Type: application/json; charset=utf-8');

// =======================
// CONFIG EN UN SOLO ARCHIVO
// =======================
define('API_SECRET', 'CAMBIA-ESTO-POR-UNO-LARGO-Y-SEGURO');

// N8N webhook (Production URL)
define('N8N_WEBHOOK_URL', 'https://TU-N8N-DOMINIO/webhook/landing-facebook');

// Opcional: enviar también directo al CRM
define('SEND_TO_CRM_DIRECT', false);

// Endpoint CRM (según tu requerimiento: crm.sigurban.com)
define('CRM_ENDPOINT_URL', 'https://crm.sigurban.com/apileads/chatbot');
define('CRM_BEARER_TOKEN', 'PEGAR_AQUI_TOKEN_SI_ACTIVAS_SEND_TO_CRM_DIRECT');

// Timeouts
define('HTTP_TIMEOUT_SECONDS', 12);

// =======================
// HELPERS
// =======================
function respond($code, $payload) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

function only_digits($v) {
  return preg_replace('/\D+/', '', (string)$v);
}

function trim_str($v) {
  return is_string($v) ? trim($v) : '';
}

function read_input_data() {
  $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
  $raw = file_get_contents('php://input');

  // JSON
  if (stripos($contentType, 'application/json') !== false) {
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
  }

  // Form-data / urlencoded
  if (!empty($_POST)) return $_POST;

  // Fallback parse raw
  $arr = [];
  if (!empty($raw)) parse_str($raw, $arr);
  return is_array($arr) ? $arr : [];
}

function http_post_json($url, $payload, $headers = []) {
  $ch = curl_init($url);
  $defaultHeaders = ['Content-Type: application/json'];
  $allHeaders = array_merge($defaultHeaders, $headers);

  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $allHeaders,
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT => HTTP_TIMEOUT_SECONDS,
  ]);

  $body = curl_exec($ch);
  $err  = curl_error($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  return [
    'ok' => $err ? false : true,
    'http_code' => $code ?: 0,
    'body' => $body,
    'error' => $err ?: null,
  ];
}

// =======================
// ROUTING SIMPLE
// =======================

// Health check rápido: /api?ping=1
if (isset($_GET['ping'])) {
  respond(200, [
    'ok' => true,
    'service' => 'sigurban landing api',
    'ts' => date('c'),
  ]);
}

// Solo POST para crear lead
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'Method not allowed. Use POST.']);
}

$data = read_input_data();

// =======================
// SEGURIDAD MINIMA (anti-spam)
// =======================
// Soporta:
// - Header: X-Api-Key: <API_SECRET>
// - Query: ?token=<API_SECRET>
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if (!$apiKey && isset($_GET['token'])) $apiKey = (string)$_GET['token'];

if ($apiKey !== API_SECRET) {
  respond(401, ['ok' => false, 'error' => 'Unauthorized (missing/invalid API key)']);
}

// =======================
// LEER + NORMALIZAR DATOS
// =======================

$data = read_input_data();
$prefiereNoDni = !empty($data['prefiere_no_compartir_dni']) && (string)$data['prefiere_no_compartir_dni'] === '1';

// Acepta variantes de nombres de campos
$name  = trim_str($data['name'] ?? $data['nombre'] ?? '');
$dni   = only_digits($data['dni'] ?? $data['identidad'] ?? '');
$phone = only_digits($data['phone'] ?? $data['celular'] ?? $data['telefono'] ?? '');

// Validación mínima
$errors = [];
if ($name === '')  $errors[] = 'name requerido';
if ($dni === '' && !$prefiereNoDni) $errors[] = 'dni requerido';
if ($phone === '') $errors[] = 'phone requerido';

if ($errors) {
  respond(400, ['ok' => false, 'error' => 'Validación', 'details' => $errors]);
}

// Extras marketing
$payload = [
  'name' => $name,
  'dni' => $dni,
  'phone' => $phone,
  'prefiere_no_compartir_dni' => $prefiereNoDni ? 1 : 0,
  'source' => 'facebook',
  'utm_source' => trim_str($data['utm_source'] ?? ''),
  'utm_medium' => trim_str($data['utm_medium'] ?? ''),
  'utm_campaign' => trim_str($data['utm_campaign'] ?? ''),
  'utm_content' => trim_str($data['utm_content'] ?? ''),
  'utm_term' => trim_str($data['utm_term'] ?? ''),
  'fbclid' => trim_str($data['fbclid'] ?? ''),

  'landing' => 'sigurban.com/landing/facebook',
  'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
  'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
  'ts' => date('c'),
];

// =======================
// 1) ENVIAR A N8N (RECOMENDADO)
// =======================
$n8n = http_post_json(
  N8N_WEBHOOK_URL,
  $payload,
  [
    // Para que n8n también valide el origen si querés
    'X-Sigurban-Secret: ' . API_SECRET,
  ]
);

if (!$n8n['ok']) {
  respond(502, [
    'ok' => false,
    'error' => 'No se pudo conectar con n8n',
    'details' => $n8n['error'],
  ]);
}

// Si n8n responde no-2xx, lo devolvemos como error (útil para debug)
if ($n8n['http_code'] < 200 || $n8n['http_code'] >= 300) {
  respond($n8n['http_code'] ?: 502, [
    'ok' => false,
    'error' => 'n8n respondió con error',
    'n8n_http_code' => $n8n['http_code'],
    'n8n_body' => $n8n['body'],
  ]);
}

// =======================
// 2) OPCIONAL: ENVIAR DIRECTO AL CRM TAMBIÉN
// =======================
$crmResult = null;

if (SEND_TO_CRM_DIRECT) {
  if (!CRM_BEARER_TOKEN || CRM_BEARER_TOKEN === 'PEGAR_AQUI_TOKEN_SI_ACTIVAS_SEND_TO_CRM_DIRECT') {
    respond(500, [
      'ok' => false,
      'error' => 'SEND_TO_CRM_DIRECT=true pero no configuraste CRM_BEARER_TOKEN',
    ]);
  }

  $crmResult = http_post_json(
    CRM_ENDPOINT_URL,
    [
      'name' => $name,
      'dni' => $dni,
      'phone' => $phone,
    ],
    [
      'Authorization: Bearer ' . CRM_BEARER_TOKEN,
    ]
  );
}

// =======================
// RESPUESTA FINAL
// =======================
respond(200, [
  'ok' => true,
  'message' => 'Lead recibido y enviado a n8n',
  'sent_to_n8n' => true,
  'n8n_http_code' => $n8n['http_code'],
  // Devolver cuerpo de n8n ayuda en pruebas; si ya estás en prod, podés quitarlo
  'n8n_body' => $n8n['body'],
  'sent_to_crm_direct' => SEND_TO_CRM_DIRECT,
  'crm_debug' => $crmResult, // null si no se usó
]);


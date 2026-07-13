// api/leadscrm.js
(function (w) {
  const DEFAULT_ENDPOINT = 'api/leadscrm.php';

  function parseJsonSafe(text, fallback = null) {
    try { return JSON.parse(text); } catch { return fallback; }
  }

  function extractMessage(data) {
    return String(data?.message || data?.data?.message || data?.error?.message || '');
  }

  // Detección MÁS robusta (por si cambia el texto exacto)
  function isDuplicateDni(status, data) {
    const msg = extractMessage(data).toLowerCase();
    const st = Number(status || data?.status || data?.statusCode || data?.data?.statusCode || 0);
    if (st !== 400) return false;

    return (
      msg.includes('ya existe un prospecto') ||
      (msg.includes('dni') && msg.includes('existe')) ||
      msg.includes('duplicate') ||
      msg.includes('duplicado') ||
      msg.includes('already exists')
    );
  }

  async function createLead({ name, dni, phone, endpoint = DEFAULT_ENDPOINT, extra = {} }) {
    const payload = {
      nombre: String(name || '').trim(),
      dni: String(dni || '').trim(),
      telefono: String(phone || '').trim(),
      ...extra
    };

    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''));

    const res = await fetch(endpoint, { method: 'POST', body: fd });

    const text = await res.text();
    const data = parseJsonSafe(text, { ok: res.ok, raw: text });
    const msg = extractMessage(data);

    // ✅ Duplicado -> NO error, devolvemos exists:true
    if (isDuplicateDni(res.status, data)) {
      return {
        ok: true,
        exists: true,
        status: res.status,
        message: msg,
        data
      };
    }

    // ❌ Otros errores
    if (!res.ok || data?.ok === false) {
      const err = new Error(msg || 'Error al enviar lead al CRM.');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  w.SigUrbanLeadsCRM = { createLead };
})(window);

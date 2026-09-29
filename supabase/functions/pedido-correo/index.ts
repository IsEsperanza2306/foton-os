// pedido-correo · manda el pedido a admon.ventas con el Formato de Pedido (Excel oficial) adjunto.
//
// Seguridad (regla: un distribuidor nunca ve datos de otro):
//   - El PIN se valida con fn_pedido_lista (security definer), la misma que usa "Mis pedidos".
//   - Solo se envía un pedido que aparezca en la lista de ESE PIN; el asunto y el cuerpo
//     se arman aquí con los datos de la base, no con lo que mande el navegador.
//   - Idempotency-Key por pedido: el mismo pedido no se manda dos veces en 24 h.
//
// Secretos (Supabase → Edge Functions → Secrets), los entrega el hilo de infraestructura:
//   RESEND_API_KEY   llave de Resend
//   MAIL_FROM        remitente verificado, p. ej. "Pedidos Foton <pedidos@ldrsolutions.com.mx>"
//   MAIL_TO          opcional, default admon.ventas@ldrsolutions.com.mx
//   MAIL_CC_FIJO     opcional, correos separados por coma que siempre van en copia
//   ALLOWED_ORIGINS  opcional, default https://isesperanza2306.github.io
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase automáticamente.

const MAIL_TO = Deno.env.get("MAIL_TO") ?? "admon.ventas@ldrsolutions.com.mx";
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://isesperanza2306.github.io").split(",").map((s) => s.trim());
const MAX_XLSX = 2_000_000; // bytes en base64 (la plantilla llena pesa ~60 KB)
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type Linea = {
  modelo: string; anio: string | number; cantidad: number; precio_unit: number; fondo_unit: number; monto: number;
  mes: string; lugar: string; dom: string; color: string | null; nota: string | null;
  entregas: { mes: string; cant: number }[];
};
type Pedido = {
  id: string; folio: number; fecha: string; unidades: number; subtotal: number; iva: number; total: number;
  comentarios: string | null; nombre: string; cargo: string; aceptacion_at: string | null; c: string; r: string; y: string;
  lineas: Linea[] | null;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fechaMx = (iso: string) => String(iso).slice(0, 10).split("-").reverse().join("/");
const mesTxt = (ym: string) => { const [y, m] = ym.split("-"); return (MESES[+m - 1] ?? ym) + " " + y; };

function correo(p: Pedido) {
  const ls = p.lineas ?? [];
  const rows = ls.map((l, i) =>
    `${i + 1}. ${l.cantidad} × ${l.modelo} ${l.anio} | ${fmt(l.precio_unit)} s/IVA | Fondo pub. ${fmt(l.fondo_unit * l.cantidad)} | Monto ${fmt(l.monto)}\n` +
    `   Facturación: ${l.mes} | Entrega: ${l.lugar} | Domicilio: ${l.dom}${l.color ? " | Color: " + l.color : ""}`
  );
  const surt = ls.filter((l) => l.entregas.length || l.nota).map((l) =>
    `• ${l.modelo} ${l.anio} (${l.cantidad} u.): ` +
    (l.entregas.length ? l.entregas.map((e) => `${e.cant} en ${mesTxt(e.mes).toLowerCase()}`).join(", ") : "sin mes definido") +
    (l.nota ? " — " + l.nota : "")
  );
  const com = (p.comentarios ?? "").trim();
  const surtTxt = surt.length || com
    ? "SURTIMIENTO SOLICITADO\n" + surt.join("\n") + (com ? (surt.length ? "\n\n" : "") + "Comentarios generales: " + com : "") + "\n\n"
    : "";
  return {
    asunto: `Pedido de unidades · ${p.c} · Folio ${p.folio} · ${p.unidades} ${p.unidades === 1 ? "unidad" : "unidades"} · ${fmt(p.total)}`,
    cuerpo: `PEDIDO DE UNIDADES · FOLIO ${p.folio}\n` +
      `Distribuidor: ${p.r} (${p.c} · ${p.y})\n` +
      `Fecha de solicitud: ${fechaMx(p.fecha)}\n\n` +
      rows.join("\n") + "\n\n" +
      `Subtotal: ${fmt(p.subtotal)}\nIVA 16%: ${fmt(p.iva)}\nTOTAL: ${fmt(p.total)}\n\n` +
      surtTxt +
      `Autoriza: ${p.nombre} — ${p.cargo}\n\n` +
      "Se adjunta el Formato de Pedido de Unidades (Excel).\n" +
      "Enviado automáticamente desde el Portal de Distribuidores Foton.",
  };
}

function ccLista(raw: unknown): string[] | null {
  const fijo = (Deno.env.get("MAIL_CC_FIJO") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const dist = String(raw ?? "").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  if (dist.length > 5 || dist.some((e) => !EMAIL_RE.test(e))) return null;
  return [...new Set([...fijo, ...dist].map((e) => e.toLowerCase()))].filter((e) => e !== MAIL_TO.toLowerCase());
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const res = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return res(405, { ok: false, error: "Método no permitido" });
  if (!ORIGINS.includes(origin)) return res(403, { ok: false, error: "Origen no permitido" });

  const key = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("MAIL_FROM");
  if (!key || !from) return res(503, { ok: false, error: "Envío automático no configurado" });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return res(400, { ok: false, error: "Solicitud inválida" }); }
  const pin = String(b.pin ?? ""), pedidoId = String(b.pedido_id ?? ""), xlsx = String(b.xlsx_b64 ?? "");
  if (!/^\d{6}$/.test(pin)) return res(400, { ok: false, error: "PIN inválido" });
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) return res(400, { ok: false, error: "Pedido inválido" });
  // un .xlsx es un zip: en base64 empieza con "UEsDB" (PK\x03\x04)
  if (!xlsx.startsWith("UEsDB") || xlsx.length > MAX_XLSX || !/^[A-Za-z0-9+/=]+$/.test(xlsx)) {
    return res(400, { ok: false, error: "Archivo Excel inválido" });
  }
  const cc = ccLista(b.cc);
  if (cc === null) return res(400, { ok: false, error: "Revisa los correos en copia (máximo 5, separados por coma)" });

  // valida el PIN y trae SOLO los pedidos de ese distribuidor
  const rpc = await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/rpc/fn_pedido_lista", {
    method: "POST",
    headers: {
      apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      Authorization: "Bearer " + Deno.env.get("SUPABASE_ANON_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_pin: pin }),
  });
  if (!rpc.ok) return res(403, { ok: false, error: "PIN inválido" });
  const pedidos = (await rpc.json()) as Pedido[] | null;
  const p = (pedidos ?? []).find((x) => x.id === pedidoId);
  if (!p) return res(404, { ok: false, error: "Pedido no encontrado" });

  const { asunto, cuerpo } = correo(p);
  const pedirNom = String(b.archivo ?? "");
  const archivo = /^Pedido_[A-Za-z0-9_-]{1,80}_\d+\.xlsx$/.test(pedirNom) && pedirNom.endsWith(`_${p.folio}.xlsx`)
    ? pedirNom // mismo nombre que la copia que descargó el distribuidor
    : `Pedido_${p.c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")}_${p.folio}.xlsx`;
  const envio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "Idempotency-Key": "pedido-" + p.id },
    body: JSON.stringify({
      from, to: [MAIL_TO], cc: cc.length ? cc : undefined, reply_to: cc.length ? cc : undefined,
      subject: asunto, text: cuerpo, attachments: [{ filename: archivo, content: xlsx }],
    }),
  });
  if (!envio.ok) {
    console.error("resend", envio.status, await envio.text());
    return res(502, { ok: false, error: "El proveedor de correo no aceptó el envío" });
  }
  const j = await envio.json().catch(() => ({}));
  return res(200, { ok: true, id: j.id ?? null, folio: p.folio });
});

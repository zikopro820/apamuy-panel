/* ===== Panel del restaurante · Mesas (pedidos para consumir en el local, sin comisión) ===== */
let MP = [], MDOCS = {}, MP_ULT = null, MP_ON = false;
const mid = k => `${NEG.id}_${k}`;
function vigilarMesas() {
  if (MP_ON) return; MP_ON = true;
  DB.escucharLista("pedidosMesa", [["negocioId", "==", NEG.id]], l => {
    MP = l.filter(p => !["cerrado", "rechazado"].includes(p.estado));
    const nuevos = MP.filter(p => ["por-confirmar", "nuevo"].includes(p.estado)).map(p => p.id);
    if (MP_ULT && nuevos.some(id => !MP_ULT.includes(id))) { beep(3); toast("🔔 ¡Nuevo pedido en mesa!"); }
    MP_ULT = nuevos; marcarNavMesas(); if (VISTA === "mesas") pintarMesas();
  });
  DB.escucharLista("mesas", [["negocioId", "==", NEG.id]], l => {
    const antes = Object.values(MDOCS).filter(m => m.llamada).map(m => m.id + m.llamada);
    MDOCS = Object.fromEntries(l.map(m => [m.num, m]));
    const ahora = l.filter(m => m.llamada).map(m => m.id + m.llamada); if (ahora.some(x => !antes.includes(x)) && MP_ULT !== null) { beep(2); toast("🔔 Una mesa te está llamando"); }
    marcarNavMesas(); if (VISTA === "mesas") pintarMesas();
  });
}
function marcarNavMesas() {
  const n = MP.filter(p => p.estado === "por-confirmar" || p.estado === "nuevo").length + Object.values(MDOCS).filter(m => m.llamada).length;
  const c = document.getElementById("cnt-mesas"); if (c) { c.textContent = n || ""; c.hidden = !n; }
}
VIEWS.mesas = async () => {
  vigilarMesas();
  $("#view").innerHTML = topBar("Mesas", "Pedidos para consumir en tu local · sin comisión. Confirma el primer pedido de cada cliente.", `<button class="btn btn-light btn-sm" id="qrM">${ico("grid")} Imprimir QR de mesas</button>`) +
    `<div class="ms-lg"><span><i class="r"></i>Pedido nuevo o llamada</span><span><i class="a"></i>Ocupada</span><span><i class="v"></i>Abierta</span><span><i class="g"></i>Libre</span></div><div class="ms-g" id="msG"></div>`;
  $("#qrM").onclick = () => imprimirQRMesas(NEG);
  $("#view").onclick = accionMesa; pintarMesas();
};
function pintarMesas() {
  const G = $("#msG"); if (!G) return; const N = Math.max(+NEG.mesasN || 0, ...MP.map(p => p.mesa));
  G.innerHTML = Array.from({ length: N }, (_, i) => i + 1).map(k => {
    const ps = MP.filter(p => p.mesa === k).sort((a, b) => String(a.creado).localeCompare(b.creado)), m = MDOCS[k] || {}, tot = ps.filter(p => p.estado !== "por-confirmar").reduce((s, p) => s + p.total, 0);
    const pc = ps.filter(p => p.estado === "por-confirmar"), nu = ps.filter(p => p.estado === "nuevo"), nombres = [...new Set(ps.map(p => p.nombre))].join(", ");
    const cls = pc.length || nu.length || m.llamada ? "nu" : ps.length || m.estado === "ocupada" ? "oc" : m.estado === "abierta" ? "ab" : "lib";
    const chip = m.llamada === "cuenta" ? "PIDE LA CUENTA" : m.llamada === "moza" ? "LLAMA A LA MOZA" : pc.length ? "POR CONFIRMAR" : nu.length ? "NUEVO PEDIDO" : cls === "oc" ? "OCUPADA" : cls === "ab" ? "ABIERTA" : "LIBRE";
    return `<div class="ms ${cls}"><span class="ms-c">${chip}</span><b>Mesa ${k}</b>${nombres ? `<small>${esc(nombres)}</small>` : ""}
      ${pc.map(p => `<div class="ms-p pc"><div><b>${esc(p.nombre)}</b> · ${p.items.map(x => `${x.cant}× ${esc(x.n)}`).join(", ")}${p.nota ? `<em>“${esc(p.nota)}”</em>` : ""}
          <small>${S(p.total)} · ${p.sinUbic ? "⚠ Sin ubicación" : p.dist >= 0 ? `a ${Math.round(p.dist * 1000)} m del local` : ""}</small></div>
        <div class="ms-b"><button class="btn btn-pri btn-sm" data-ok="${esc(p.id)}">Aceptar</button><button class="btn btn-light btn-sm" data-no="${esc(p.id)}">Rechazar</button><button class="btn btn-light btn-sm danger" data-blq="${esc(p.id)}" title="No dejar pedir más a este celular">Bloquear</button></div></div>`).join("")}
      ${nu.map(p => `<div class="ms-p"><div><b>${esc(p.nombre)}</b> · ${p.items.map(x => `${x.cant}× ${esc(x.n)}`).join(", ")}${p.nota ? `<em>“${esc(p.nota)}”</em>` : ""}</div><div class="ms-b"><button class="btn btn-pri btn-sm" data-srv="${esc(p.id)}">Llevado a la mesa</button></div></div>`).join("")}
      ${tot ? `<span class="ms-t">${S(tot)}</span>` : ""}
      <div class="ms-b">${m.llamada ? `<button class="btn btn-pri btn-sm" data-at="${k}">Atendido</button>` : ""}${ps.length ? `<button class="btn btn-light btn-sm" data-cta="${k}">Ver cuenta</button><button class="btn btn-sm ms-close" data-cerrar-m="${k}">Cerrar cuenta</button>` : NEG.mesaAbrir ? (m.estado === "abierta" ? `<button class="btn btn-light btn-sm" data-lib="${k}">Cerrar mesa</button>` : `<button class="btn btn-light btn-sm" data-abrir="${k}">Abrir mesa</button>`) : ""}</div></div>`;
  }).join("") || vacio("Indica cuántas mesas tienes en «Mi negocio».");
}
async function accionMesa(e) {
  const t = e.target.closest("button"); if (!t) return; const d = t.dataset, hoy = new Date().toISOString(), P = id => MP.find(p => p.id === id);
  try {
    if (d.ok) { const p = P(d.ok), m = MDOCS[p.mesa] || {}; t.disabled = true;
      await DB.batch([{ op: "set", col: "pedidosMesa", id: p.id, data: { estado: "nuevo", actualizado: hoy } },
        { op: "set", col: "mesas", id: mid(p.mesa), data: { negocioId: NEG.id, num: p.mesa, estado: "ocupada", confirmados: [...new Set([...(m.estado === "libre" ? [] : m.confirmados || []), p.uid])].slice(-30), actualizado: hoy } }]); toast(`Pedido de ${p.nombre} confirmado · a cocina`); }
    else if (d.no) { await DB.set("pedidosMesa", d.no, { estado: "rechazado", actualizado: hoy }); toast("Pedido rechazado"); }
    else if (d.blq) { const p = P(d.blq); if (!confirm(`¿Bloquear a este celular (${p.nombre})? Ya no podrá pedir en mesa en tu local.`)) return;
      await DB.batch([{ op: "set", col: "bloqueosMesa", id: `${NEG.id}_${p.uid}`, merge: false, data: { negocioId: NEG.id, uid: p.uid, nombre: p.nombre, creado: hoy } }, { op: "set", col: "pedidosMesa", id: p.id, data: { estado: "rechazado", actualizado: hoy } }]); toast("Celular bloqueado"); }
    else if (d.srv) { await DB.set("pedidosMesa", d.srv, { estado: "servido", actualizado: hoy }); }
    else if (d.at) { await DB.set("mesas", mid(+d.at), { llamada: null, actualizado: hoy }); }
    else if (d.abrir) { await DB.set("mesas", mid(+d.abrir), { negocioId: NEG.id, num: +d.abrir, estado: "abierta", confirmados: [], actualizado: hoy }); toast(`Mesa ${d.abrir} abierta`); }
    else if (d.lib) { await DB.set("mesas", mid(+d.lib), { negocioId: NEG.id, num: +d.lib, estado: "libre", confirmados: [], llamada: null, actualizado: hoy }); }
    else if (d.cta) cuentaMesa(+d.cta);
    else if (d.cerrarM) { const k = +d.cerrarM, ps = MP.filter(p => p.mesa === k), tot = ps.filter(p => p.estado !== "por-confirmar").reduce((s, p) => s + p.total, 0);
      if (!confirm(`¿Cerrar la cuenta de la mesa ${k}? Total ${S(tot)}. La mesa queda libre.`)) return;
      await DB.batch([...ps.map(p => ({ op: "set", col: "pedidosMesa", id: p.id, data: { estado: p.estado === "por-confirmar" ? "rechazado" : "cerrado", pagado: p.estado !== "por-confirmar", cerradoEn: hoy } })),
        { op: "set", col: "mesas", id: mid(k), data: { negocioId: NEG.id, num: k, estado: "libre", confirmados: [], llamada: null, actualizado: hoy } }]); toast(`Mesa ${k} cerrada · ${S(tot)}`); }
  } catch (x) { console.error(x); toast("No se pudo: " + (x.code || x.message), true); }
}
function cuentaMesa(k) {
  const ps = MP.filter(p => p.mesa === k && p.estado !== "por-confirmar"), items = {};
  ps.forEach(p => p.items.forEach(x => { const key = x.n + (x.det || "") + x.precio; items[key] = items[key] ? { ...items[key], cant: items[key].cant + x.cant } : { ...x }; }));
  const tot = ps.reduce((s, p) => s + p.total, 0);
  modal(`Cuenta · Mesa ${k}`, `<div class="ms-cta">${Object.values(items).map(x => `<div><span>${x.cant}× ${esc(x.n)}${x.det ? `<small>${esc(x.det)}</small>` : ""}</span><b>${S(x.precio * x.cant)}</b></div>`).join("")}
    <div class="t"><span>Total</span><b>${S(tot)}</b></div><p class="muted sm">${ps.length} pedido(s) · ${esc([...new Set(ps.map(p => p.nombre))].join(", "))}</p></div>`, null, "Cerrar");
}

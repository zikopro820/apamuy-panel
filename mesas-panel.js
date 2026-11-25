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
let MS_TAB = "ahora";
VIEWS.mesas = async () => {
  vigilarMesas();
  const tabs = `<div class="ms-tabs"><button data-tab="ahora" class="${MS_TAB === "ahora" ? "on" : ""}">${ico("grid")} Ahora</button><button data-tab="hist" class="${MS_TAB === "hist" ? "on" : ""}">${ico("percent")} Historial y ventas</button></div>`;
  if (MS_TAB === "hist") return historialMesas(tabs);
  $("#view").innerHTML = topBar("Mesas", "Pedidos para consumir en tu local · sin comisión. Confirma el primer pedido de cada cliente.", `<button class="btn btn-light btn-sm" id="qrM">${ico("grid")} Imprimir QR de mesas</button>`) + tabs +
    `<div class="ms-lg"><span><i class="r"></i>Pedido nuevo o llamada</span><span><i class="a"></i>Ocupada</span><span><i class="v"></i>Abierta</span><span><i class="g"></i>Libre</span></div><div class="ms-g" id="msG"></div>`;
  $("#qrM").onclick = () => imprimirQRMesas(NEG);
  $("#view").onclick = e => { const t = e.target.closest("[data-tab]"); if (t) { MS_TAB = t.dataset.tab; return VIEWS.mesas(); } accionMesa(e); }; pintarMesas();
};

/* ===== Historial y ventas de mesas (separado de los pedidos por delivery) ===== */
let MSH_R = "hoy", MSH_D = "", MSH_H = "", MSH_Q = "";
async function historialMesas(tabs) {
  const v = $("#view");
  v.innerHTML = topBar("Mesas", "Solo pedidos para consumir en tu local. No incluye pedidos por delivery ni recojo.") + tabs + `<div id="msh" class="msh"><p class="muted">Cargando…</p></div>`;
  const todos = await DB.list("pedidosMesa", ["negocioId", "==", NEG.id]).catch(() => []);
  const rango = () => { const h = HOY(); return MSH_R === "hoy" ? [h, h] : MSH_R === "ayer" ? [addD(h, -1), addD(h, -1)] : MSH_R === "7" ? [addD(h, -6), h] : MSH_R === "mes" ? [h.slice(0, 8) + "01", h] : [MSH_D || h, MSH_H || h]; };
  const pintar = () => {
    const [d1, d2] = rango(), dentro = iso => { const x = isoD(iso); return x >= d1 && x <= d2; };
    const cerr = todos.filter(p => p.estado === "cerrado" && p.cerradoEn && dentro(p.cerradoEn)), rech = todos.filter(p => p.estado === "rechazado" && dentro(p.creado));
    // Una «cuenta» = los pedidos de una mesa cerrados juntos
    const cu = {}; cerr.forEach(p => { const k = p.mesa + "|" + p.cerradoEn; (cu[k] = cu[k] || { mesa: p.mesa, cierre: p.cerradoEn, ps: [] }).ps.push(p); });
    let cuentas = Object.values(cu).map(c => ({ ...c, llegada: c.ps.map(p => p.creado).sort()[0], total: c.ps.reduce((s, p) => s + p.total, 0), nombres: [...new Set(c.ps.map(p => p.nombre))] })).sort((a, b) => b.cierre.localeCompare(a.cierre));
    const total = cuentas.reduce((s, c) => s + c.total, 0), platos = {}, porMesa = {}, porHora = Array(24).fill(0);
    cerr.forEach(p => { p.items.forEach(x => { platos[x.n] = platos[x.n] || { n: x.n, cant: 0, s: 0 }; platos[x.n].cant += x.cant; platos[x.n].s += x.cant * x.precio; }); porHora[new Date(p.creado).getHours()] += p.total; });
    cuentas.forEach(c => { porMesa[c.mesa] = porMesa[c.mesa] || { mesa: c.mesa, veces: 0, s: 0 }; porMesa[c.mesa].veces++; porMesa[c.mesa].s += c.total; });
    const nPlatos = Object.values(platos).reduce((s, x) => s + x.cant, 0), rk = Object.values(porMesa).sort((a, b) => b.s - a.s), top = Object.values(platos).sort((a, b) => b.cant - a.cant).slice(0, 8);
    const hs = porHora.map((s, h) => ({ h, s })).filter(x => x.s > 0), hmin = hs.length ? Math.min(...hs.map(x => x.h)) : 11, hmax = hs.length ? Math.max(...hs.map(x => x.h)) : 22, maxH = Math.max(1, ...porHora);
    const hh = h => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`, mins = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));
    const q = MSH_Q.toLowerCase(), lista = q ? cuentas.filter(c => ("mesa " + c.mesa + " " + c.nombres.join(" ") + " " + c.ps.map(p => p.items.map(x => x.n).join(" ")).join(" ")).toLowerCase().includes(q)) : cuentas;
    $("#msh").innerHTML = `<div class="msh-f">${[["hoy", "Hoy"], ["ayer", "Ayer"], ["7", "Últimos 7 días"], ["mes", "Este mes"], ["rango", "Elegir fechas"]].map(([k, t]) => `<button data-r="${k}" class="${MSH_R === k ? "on" : ""}">${t}</button>`).join("")}
        ${MSH_R === "rango" ? `<input type="date" id="mshD" value="${d1}"> a <input type="date" id="mshH" value="${d2}">` : ""}<button class="btn btn-light btn-sm" id="mshCsv">${ico("download")} Descargar Excel (CSV)</button></div>
      <div class="msh-k"><div><small>Total vendido en mesas</small><b>${S(total)}</b></div><div><small>Cuentas cerradas</small><b>${cuentas.length}</b></div><div><small>Ticket promedio</small><b>${S(cuentas.length ? total / cuentas.length : 0)}</b></div><div><small>Platos vendidos</small><b>${nPlatos}</b></div></div>
      <div class="msh-2"><section class="card"><h3>Mesas más atendidas</h3>${rk.map((m, i) => `<div class="msh-r"><span class="msh-i">${i + 1}</span><b>Mesa ${m.mesa}</b><small>${m.veces} ${m.veces === 1 ? "vez" : "veces"}</small><em>${S(m.s)}</em><i style="--w:${Math.round(m.s / (rk[0]?.s || 1) * 100)}%"></i></div>`).join("") || `<p class="muted">Sin ventas en estas fechas.</p>`}</section>
        <section class="card"><h3>Ventas por hora</h3>${hs.length ? `<div class="msh-h">${Array.from({ length: hmax - hmin + 1 }, (_, i) => hmin + i).map(h => `<div title="${hh(h)}: ${S(porHora[h])}"><span style="height:${Math.round(porHora[h] / maxH * 100)}%"></span><small>${hh(h)}</small></div>`).join("")}</div>
          <p class="muted sm">Hora con más ventas: <b>${hh(porHora.indexOf(Math.max(...porHora)))}</b> (${S(Math.max(...porHora))})</p>` : `<p class="muted">Sin ventas en estas fechas.</p>`}</section>
        <section class="card"><h3>Platos más pedidos</h3>${top.map(x => `<div class="msh-pl"><span>${x.cant}×</span><b>${esc(x.n)}</b><em>${S(x.s)}</em></div>`).join("") || `<p class="muted">Sin ventas en estas fechas.</p>`}</section></div>
      <section class="card"><div class="msh-lh"><h3>Historial de cuentas</h3><input type="search" id="mshQ" placeholder="Buscar mesa, cliente o plato…" value="${esc(MSH_Q)}"></div>
        <div class="msh-t"><div class="msh-th"><span>Fecha</span><span>Mesa</span><span>Llegó · Cerró</span><span>Clientes</span><span>Total</span><span></span></div>
        ${lista.map((c, i) => `<div class="msh-tr"><span>${fmtF(isoD(c.cierre), { day: "numeric", month: "short" })}</span><b>Mesa ${c.mesa}</b><span>${new Date(c.llegada).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} · ${new Date(c.cierre).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}<small>${mins(c.llegada, c.cierre)} min</small></span><span>${esc(c.nombres.join(", "))}</span><b>${S(c.total)}</b><button class="btn btn-light btn-sm" data-det="${cuentas.indexOf(c)}">Ver detalle</button></div>`).join("") || `<p class="muted">No hay cuentas cerradas en estas fechas.</p>`}</div>
        ${rech.length ? `<p class="muted sm msh-rech">Pedidos rechazados en estas fechas: <b>${rech.length}</b> (no se suman a las ventas).</p>` : ""}</section>`;
    $("#mshQ").oninput = e => { MSH_Q = e.target.value; const pos = e.target.selectionStart; pintar(); const i = $("#mshQ"); i.focus(); i.setSelectionRange(pos, pos); };
    $("#mshD")?.addEventListener("change", e => { MSH_D = e.target.value; pintar(); }); $("#mshH")?.addEventListener("change", e => { MSH_H = e.target.value; pintar(); });
    $("#mshCsv").onclick = () => { const f = x => `"${String(x).replace(/"/g, '""')}"`, filas = [["Fecha", "Mesa", "Llegada", "Cierre", "Minutos", "Clientes", "Platos", "Total"]].concat(cuentas.map(c => [isoD(c.cierre), c.mesa, new Date(c.llegada).toLocaleTimeString("es-PE"), new Date(c.cierre).toLocaleTimeString("es-PE"), mins(c.llegada, c.cierre), c.nombres.join(" / "), c.ps.flatMap(p => p.items.map(x => `${x.cant}x ${x.n}`)).join(" / "), c.total.toFixed(2)]));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + filas.map(r => r.map(f).join(";")).join("\n")], { type: "text/csv" })); a.download = `ventas-mesas-${d1}_${d2}.csv`; a.click(); };
    v.onclick = e => { const t = e.target.closest("[data-tab]"); if (t) { MS_TAB = t.dataset.tab; return VIEWS.mesas(); }
      const r = e.target.closest("[data-r]"); if (r) { MSH_R = r.dataset.r; return pintar(); }
      const d = e.target.closest("[data-det]"); if (d) { const c = cuentas[+d.dataset.det], it = {}; c.ps.forEach(p => p.items.forEach(x => { const k = x.n + (x.det || ""); it[k] = it[k] ? { ...it[k], cant: it[k].cant + x.cant } : { ...x }; }));
        modal(`Mesa ${c.mesa} · ${fmtFH(c.cierre)}`, `<div class="ms-cta">${Object.values(it).map(x => `<div><span>${x.cant}× ${esc(x.n)}${x.det ? `<small>${esc(x.det)}</small>` : ""}</span><b>${S(x.precio * x.cant)}</b></div>`).join("")}<div class="t"><span>Total</span><b>${S(c.total)}</b></div>
          <p class="muted sm">Llegó ${fmtFH(c.llegada)} · cerró ${fmtFH(c.cierre)} (${mins(c.llegada, c.cierre)} min) · ${c.ps.length} pedido(s) · ${esc(c.nombres.join(", "))}</p></div>`, null, "Cerrar"); } };
  };
  pintar();
}
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

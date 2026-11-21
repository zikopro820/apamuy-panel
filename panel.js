/* =========================================================
   APAMUY — Panel de negocios y del administrador general
   Un negocio solo ve y edita lo suyo. El admin ve todo, aprueba
   o suspende negocios, pero NO edita sus platos.
   ========================================================= */
const VIEWS = {}; let VISTA = "", YO = null, NEG = null, ADMIN = false;
const NAV_NEG = [["inicio", "home", "Inicio"], ["pedidos", "bell", "Pedidos"], ["carta", "fire", "Carta y precios"], ["caja", "cash", "Caja"], ["comision", "percent", "Comisión Apamuy"], ["negocio", "store", "Mi negocio"]];
const NAV_ADM = [["resumen", "home", "Resumen"], ["negocios", "store", "Negocios"], ["pedidosAdm", "bell", "Pedidos"], ["enviosAdm", "box", "Envíos"], ["comisiones", "percent", "Comisiones"], ["repartidores", "bike", "Repartidores"], ["cobrosRep", "cash", "Cobros repartidores"],
  ["clientes", "users", "Clientes"], ["web", "compass", "Página web"], ["rubros", "grid", "Rubros"], ["banners", "star", "Banners"], ["config", "gear", "Comisión y delivery"]];
const ESTADOS_N = { pendiente: ["En revisión", "warn"], activo: ["Activo", "ok"], suspendido: ["Suspendido", "bad"], rechazado: ["Rechazado", "bad"] };
const estN = e => { const [t, c] = ESTADOS_N[e] || [e, "mute"]; return `<span class="st ${c}">${t}</span>`; };
const estP = (e, p) => { const [t, c] = EST_P[e] || [e, "mute"]; return `<span class="st ${c}">${p && p.entrega === "recojo" && e === "listo" ? "Listo para recoger" : t}</span>`; };
const METODOS = ["Efectivo", "Yape", "Plin", "Transferencia"];
const pctDe = n => n && n.comision != null && n.comision !== "" ? +n.comision : +CONF.comision;
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/* ================= ENTRAR / CREAR CUENTA ================= */
function pantallaLogin(modo = "entrar") {
  document.body.innerHTML = `<main class="login"><div class="l-box"><img class="l-img" src="favicon.svg" alt="" width="64" height="64"><h1>Apamuy para negocios</h1>
    <p>${modo === "crear" ? "Crea tu cuenta y registra tu negocio. Lo revisamos y lo publicamos en la app." : "Entra para ver tus pedidos y tu carta."}</p>
    ${DEMO ? `<div class="demo-n"><b>MODO DEMO</b> · elige con qué cuenta probar:</div><div class="demo-l">${[["demo-pollon", "pollon@demo.pe", "Pollería El Pollón (activo)"], ["neg-jugos", "jugos@demo.pe", "Juguería La Fresca (en revisión)"], ["neg-nuevo", "nuevo@demo.pe", "Negocio nuevo (registrarse)"], ["adm", (AP.admins || [])[0], "Administrador Apamuy"]].map(([u, e, t]) => `<button class="btn btn-light" data-demo="${u}|${e}">${t}</button>`).join("")}</div>`
    : `<button class="btn btn-google btn-lg" id="lG"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>
      <div class="o-sep"><span>o con tu correo</span></div>
      <form id="lf" class="l-f">${fld("email", "Correo", "", { type: "email", req: true, extra: 'autocomplete="username"' })}${fld("pass", modo === "crear" ? "Crea una contraseña (mín. 6)" : "Contraseña", "", { type: "password", req: true, extra: `autocomplete="${modo === "crear" ? "new-password" : "current-password"}" minlength="6"` })}
      <p class="l-err js-auth-err" id="lErr" role="alert"></p><button class="btn btn-pri btn-lg">${modo === "crear" ? "Crear cuenta" : "Entrar"}</button></form>
      ${modo === "crear" ? `<button class="btn-link" id="lM">Ya tengo cuenta · Entrar</button>` : `<button class="btn-link" id="lM">¿Tu negocio aún no está en Apamuy? Regístralo aquí</button><button class="btn-link" id="lR">Olvidé mi contraseña</button>`}`}
    </div></main>`;
  if (DEMO) return $$("[data-demo]").forEach(b => b.onclick = () => { const [uid, email] = b.dataset.demo.split("|"); Sesion._demo({ uid, email, nombre: "" }); });
  const err = $("#lErr"); errorAuthGuardado(err);
  $("#lG").onclick = async () => { err.textContent = ""; try { await Sesion.google(); } catch (e) { err.textContent = errorAuth(e); } };
  $("#lM").onclick = () => pantallaLogin(modo === "crear" ? "entrar" : "crear");
  $("#lR")?.addEventListener("click", async () => { const e = $("[name=email]").value.trim(); if (!e) return err.textContent = "Escribe tu correo arriba y vuelve a tocar «Olvidé mi contraseña»."; try { await Sesion.recuperar(e); toast("Te enviamos un correo para cambiar tu contraseña"); } catch (x) { err.textContent = errorAuth(x); } });
  $("#lf").onsubmit = async e => { e.preventDefault(); err.textContent = ""; const d = datosForm(e.currentTarget);
    try { modo === "crear" ? await Sesion.crear(d.email, d.pass) : await Sesion.correo(d.email, d.pass); } catch (x) { err.textContent = errorAuth(x); } };
}

/* ================= ARRANQUE ================= */
(async () => {
  await cargarConfig().catch(() => {}); await cargarRubros(true).catch(() => {});
  let iniciado = false;
  Sesion.alCambiar(async u => {
    if (iniciado) return location.reload(); iniciado = true; YO = u;
    if (!u) return pantallaLogin();
    ADMIN = esAdmin(u);
    if (ADMIN) return armar(NAV_ADM, "resumen");
    NEG = await DB.get("negocios", u.uid).catch(() => null);
    if (!NEG) return pantallaRegistro();
    // Ferreterías y talleres: reciben las búsquedas de repuestos (y los talleres, el auxilio mecánico)
    const nav = BQ_RUBROS.includes(NEG.rubro) ? NAV_NEG.flatMap(x => x[0] === "pedidos" ? [x, ["solicitudes", "search", NEG.rubro === "talleres" ? "Repuestos y auxilio" : "Buscan repuestos"]] : [x]) : NAV_NEG;
    armar(nav, "inicio");
  });
})();

/* ================= REGISTRO DEL NEGOCIO ================= */
function pantallaRegistro() {
  document.body.innerHTML = `<main class="reg"><div class="reg-h"><img src="favicon.svg" alt="" width="48" height="48"><div><h1>Registra tu negocio en Apamuy</h1><p>Completa los datos. Revisamos tu negocio y lo publicamos en la app (normalmente en menos de 24 horas).</p></div>
    <button class="btn btn-light btn-sm" id="regSalir">${ico("logout")} Salir</button></div><div id="regF"></div></main>`;
  $("#regSalir").onclick = () => Sesion.salir();
  formNegocio($("#regF"), null);
}
// Formulario del negocio (registro y edición). En edición no cambia el estado.
function formNegocio(box, n) {
  const a = n || { abre: "11:00", cierra: "22:00", dias: [0, 1, 2, 3, 4, 5, 6], delivery: true, recojo: true, contraEntrega: true, pagoYape: true, pagoPlin: true, tiempo: "30-40 min", pedidoMinimo: 15, email: YO.email };
  let pos = a.ubic || null, IMG = { logo: a.logo || "", portada: a.portada || "", yapeQR: a.yapeQR || "", plinQR: a.plinQR || "" };
  const foto = (k, txt, w) => `<div class="foto-up"><span class="fp-${k}" id="pv_${k}" style="background-image:url('${esc(IMG[k])}')"></span><label class="btn btn-light btn-sm">${ico("camera")} ${txt}<input type="file" accept="image/*" data-img="${k}" data-w="${w}" hidden></label></div>`;
  box.innerHTML = `<form class="card" id="nF" novalidate>
    <h2>${ico("store")} Tu negocio</h2><div class="g2">${fld("nombre", "Nombre del negocio", a.nombre || "", { req: true, full: true })}
      ${fld("rubro", "¿Qué vendes?", a.rubro || (RUBROS[0] || {}).id || "comida", { opts: RUBROS.filter(r => r.activo !== false || r.id === a.rubro).map(r => [r.id, r.nombre]) })}<label class="fld"><span>Tipo</span><select name="tipo" id="nTipo"></select></label>
      <label class="fld full" id="nRegL" hidden><span id="nRegT">Registro</span><input name="registro" id="nReg" value="${esc(a.registro || "")}"></label>
      ${fld("descripcion", "Descripción corta", a.descripcion || "", { full: true, ph: "Ej. Pollo a la brasa al carbón y parrillas" })}
      <div class="fld"><span>Logo (cuadrado)</span>${foto("logo", "Subir logo", 400)}</div><div class="fld"><span>Foto de portada (horizontal)</span>${foto("portada", "Subir portada", 1200)}</div></div>
    <h2>${ico("phone")} Contacto</h2><div class="g2">${fld("telefono", "Celular del negocio", a.telefono || "", { req: true, type: "tel" })}${fld("whatsapp", "WhatsApp (para los clientes)", a.whatsapp || "", { type: "tel", ph: "9 dígitos" })}</div>
    <h2>${ico("pin")} Ubicación</h2><div class="g3"><label class="fld"><span>Departamento</span><select name="departamento" id="nDep"></select></label><label class="fld"><span>Provincia (ciudad)</span><select name="provincia" id="nProv"></select></label><label class="fld"><span>Distrito</span><select name="distrito" id="nDis"></select></label></div>
      <p class="muted sm">Tu negocio aparece a los clientes de toda tu provincia. Mueve el pin hasta la puerta de tu local: con esto calculamos la distancia y el costo del delivery.</p>
      <div class="mapa" id="nMapa"></div><div class="g2">${fld("direccion", "Dirección", a.direccion || "", { req: true })}${fld("referencia", "Referencia", a.referencia || "")}</div>
    <h2>${ico("clock")} Horario y entrega</h2><div class="g2">${fld("abre", "Abre", a.abre, { type: "time" })}${fld("cierra", "Cierra", a.cierra, { type: "time", help: "Si cierra pasada la medianoche también funciona." })}
      <div class="full"><span class="lbl">Días de atención</span><div class="dias-ck">${DIAS.map((t, i) => `<label class="chk"><input type="checkbox" name="dia${i}" ${(a.dias || []).includes(i) ? "checked" : ""}><span>${t}</span></label>`).join("")}</div></div>
      ${fld("delivery", "Hacer delivery (con repartidores Apamuy)", a.delivery !== false, { type: "checkbox" })}${fld("recojo", "Permitir recojo en el local", a.recojo !== false, { type: "checkbox" })}
      <label class="fld"><span>Llevo delivery hasta (km)</span><input name="radioKm" type="number" min="1" step="1" value="${esc(a.radioKm || "")}" placeholder="Máximo"><small id="nRadioH"></small></label>
      ${fld("tiempo", "Tiempo que se muestra", a.tiempo || "", { ph: "30-40 min" })}${fld("pedidoMinimo", "Pedido mínimo para delivery (S/)", a.pedidoMinimo ?? 0, { type: "number", extra: 'min="0"' })}
      ${fld("extras", "Extras gratis (uno por línea, ej. cremas)", (a.extrasGratis || []).join("\n"), { type: "textarea", full: true, rows: 3, ph: "Mayonesa\nAjí\nKetchup" })}</div>
    <h2>${ico("cash")} Cómo te pagan los clientes</h2><p class="muted sm">El cliente te paga la comida <b>directo a ti</b>. El delivery lo cobra el repartidor.</p><div class="g2">
      ${fld("pagoYape", "Aceptar Yape", a.pagoYape !== false, { type: "checkbox" })}${fld("pagoPlin", "Aceptar Plin", a.pagoPlin !== false, { type: "checkbox" })}
      ${fld("yapeNum", "Número de Yape", a.yapeNum || "")}${fld("yapeTitular", "Yape a nombre de", a.yapeTitular || "")}<div class="fld full"><span>QR de Yape</span>${foto("yapeQR", "Subir QR de Yape", 600)}</div>
      ${fld("plinNum", "Número de Plin", a.plinNum || "")}${fld("plinTitular", "Plin a nombre de", a.plinTitular || "")}<div class="fld full"><span>QR de Plin</span>${foto("plinQR", "Subir QR de Plin", 600)}</div>
      ${fld("contraEntrega", "Aceptar efectivo al recibir", a.contraEntrega !== false, { type: "checkbox", full: true })}</div>
    <h2>${ico("file")} Datos del titular</h2><div class="g2">${fld("docTipo", "Documento", (a.documento || {}).tipo || "RUC", { opts: ["RUC", "DNI"] })}${fld("docNum", "Número", (a.documento || {}).numero || "", { req: true, extra: 'inputmode="numeric" maxlength="11"' })}
      ${fld("docNombre", "Razón social o nombre del titular", (a.documento || {}).nombre || "", { req: true, full: true })}</div>
    ${n ? "" : `<label class="chk full terms"><input type="checkbox" name="acepto"><span>Acepto que Apamuy cobre una comisión del <b>${pctDe(null)}%</b> sobre la comida de cada pedido entregado por la app, que pagaré cada semana. Si no pago en el plazo, mi negocio se oculta de la app hasta ponerme al día.</span></label>`}
    <p class="l-err" id="nErr" role="alert"></p><div class="f-end"><button class="btn btn-pri btn-lg">${ico("check")} ${n ? "Guardar cambios" : "Enviar para revisión"}</button></div></form>`;
  const F = $("#nF", box), err = $("#nErr", box);
  let MP = null; mapaPin($("#nMapa", box), pos || centroDe(a.departamento || CONF.ciudadInicial.dep, a.provincia || CONF.ciudadInicial.prov, a.distrito), q => pos = q).then(m => MP = m);
  const U = window.UBIGEO || {}, ord = l => l.sort((x, y) => x.localeCompare(y)), opt = (l, v) => l.map(x => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("");
  const sDep = $("#nDep", F), sProv = $("#nProv", F), sDis = $("#nDis", F);
  const llenar = (dep, prov, dis) => { sDep.innerHTML = opt(ord(Object.keys(U)), dep); const ps = ord(Object.keys(U[sDep.value] || {})); sProv.innerHTML = opt(ps, ps.includes(prov) ? prov : ps[0]);
    const ds = (U[sDep.value][sProv.value] || []).map(x => x[0]); sDis.innerHTML = opt(ds, ds.includes(dis) ? dis : ds[0]); };
  llenar(a.departamento || CONF.ciudadInicial.dep, a.provincia || CONF.ciudadInicial.prov, a.distrito);
  const irDistrito = () => { if (pos && n) return; const c = centroDe(sDep.value, sProv.value, sDis.value); if (c && MP) { MP.mapa.setView([c.lat, c.lng], 15); MP.marcador.setLatLng([c.lat, c.lng]); pos = null; } };
  sDep.onchange = () => { llenar(sDep.value); irDistrito(); }; sProv.onchange = () => { llenar(sDep.value, sProv.value); irDistrito(); }; sDis.onchange = irDistrito;
  const sRub = $("[name=rubro]", F), sTipo = $("#nTipo", F);
  const ponerRubro = () => { const r = rubroDe(sRub.value), ts = r.tipos && r.tipos.length ? r.tipos : ["General"]; sTipo.innerHTML = opt(ts, ts.includes(a.tipo) ? a.tipo : ts[0]);
    $("#nRegL", F).hidden = !r.requiereRegistro; $("#nRegT", F).textContent = (r.requiereRegistro || "Registro") + " *"; };
  // Radio de delivery: cada negocio pone el suyo, sin pasar el máximo de Apamuy para su rubro
  const ponerRadio = () => { const m = maxKmRubro(sRub.value), i = $("[name=radioKm]", F); i.max = m; i.placeholder = `${m} (máximo)`;
    $("#nRadioH", F).textContent = `Hasta ${m} km para tu rubro. Vacío = ${m} km. Los clientes más lejos te verán en «Más lejos · solo para recoger».`; };
  sRub.onchange = () => { ponerRubro(); ponerRadio(); }; ponerRubro(); ponerRadio();
  $$("[data-img]", F).forEach(i => i.onchange = async e => { const f = e.target.files[0], k = e.target.dataset.img; if (!f) return; IMG[k] = await redimensionar(f, +e.target.dataset.w, .8, k.endsWith("QR") ? "image/png" : "image/jpeg"); $("#pv_" + k).style.backgroundImage = `url('${IMG[k]}')`; });
  F.onsubmit = async e => {
    e.preventDefault(); err.textContent = ""; const d = datosForm(F);
    const req = $$("[required]", F).find(x => !String(x.value).trim()); if (req) { req.focus(); return err.textContent = "Completa: " + req.closest("label").querySelector("span").textContent.replace(" *", ""); }
    if (!pos) return err.textContent = "Mueve el pin (o toca el mapa) en la puerta de tu local.";
    if (rubroDe(d.rubro).requiereRegistro && !d.registro) return err.textContent = "Escribe tu " + rubroDe(d.rubro).requiereRegistro + ".";
    if (d.telefono.replace(/\D/g, "").length < 9) return err.textContent = "El celular debe tener 9 dígitos.";
    if (d.docTipo === "RUC" ? d.docNum.length !== 11 : d.docNum.length !== 8) return err.textContent = d.docTipo === "RUC" ? "El RUC tiene 11 dígitos." : "El DNI tiene 8 dígitos.";
    const dias = [0, 1, 2, 3, 4, 5, 6].filter(i => d["dia" + i]); if (!dias.length) return err.textContent = "Marca al menos un día de atención.";
    if (!d.pagoYape && !d.pagoPlin && !d.contraEntrega) return err.textContent = "Activa al menos una forma de pago.";
    if (d.pagoYape && !d.yapeNum) return err.textContent = "Escribe tu número de Yape (o desactiva Yape).";
    if (!n && !d.acepto) return err.textContent = "Para continuar acepta las condiciones de la comisión.";
    const b = $("button.btn-pri", F); b.disabled = true; b.textContent = "Guardando…";
    try {
      const up = {}; for (const k of Object.keys(IMG)) up[k] = await subirFoto(`negocios/${YO.uid}/${k}-${Date.now().toString(36)}.${k.endsWith("QR") ? "png" : "jpg"}`, IMG[k]);
      const wsp = d.whatsapp.replace(/\D/g, "") || d.telefono.replace(/\D/g, "");
      const data = { nombre: d.nombre, rubro: d.rubro, tipo: d.tipo, registro: rubroDe(d.rubro).requiereRegistro ? d.registro : "", departamento: d.departamento, provincia: d.provincia, distrito: d.distrito, prov: provKey(d.departamento, d.provincia), descripcion: d.descripcion, telefono: d.telefono.replace(/\D/g, ""), whatsapp: wsp.length === 9 ? "51" + wsp : wsp, direccion: d.direccion, referencia: d.referencia, ubic: pos,
        abre: d.abre, cierra: d.cierra, dias, delivery: d.delivery, recojo: d.recojo, radioKm: +d.radioKm > 0 ? Math.min(Math.round(+d.radioKm), maxKmRubro(d.rubro)) : 0, tiempo: d.tiempo, pedidoMinimo: +d.pedidoMinimo || 0, extrasGratis: d.extras.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 20),
        pagoYape: d.pagoYape, pagoPlin: d.pagoPlin, contraEntrega: d.contraEntrega, yapeNum: d.yapeNum, yapeTitular: d.yapeTitular, plinNum: d.plinNum, plinTitular: d.plinTitular, pagoTransf: false,
        documento: { tipo: d.docTipo, numero: d.docNum, nombre: d.docNombre }, ...up, actualizado: new Date().toISOString() };
      if (!n) Object.assign(data, { owner: YO.uid, email: YO.email, estado: "pendiente", creado: new Date().toISOString(), aceptoComision: pctDe(null) });
      await DB.set("negocios", YO.uid, data); toast(n ? "Cambios guardados · ya se ven en la app" : "¡Listo! Enviamos tu negocio para revisión");
      if (!n) location.reload(); else { NEG = { ...NEG, ...data }; marcaPanel(); b.disabled = false; b.innerHTML = `${ico("check")} Guardar cambios`; }
    } catch (x) { console.error(x); b.disabled = false; b.textContent = n ? "Guardar cambios" : "Enviar para revisión"; err.textContent = "No se pudo guardar: " + (x.code || x.message); }
  };
}

/* ================= ESTRUCTURA DEL PANEL ================= */
// Aviso para activar las notificaciones: que suene cada pedido aunque el panel esté cerrado
function bannerAvisos() {
  const e = estadoAvisos(); if (e === "demo") return;
  if (window.Notification?.permission === "granted") { activarAvisos("panel", true); return; }   // renueva en silencio
  if (store.get("am_noavisos", 0) > Date.now()) return;
  $("#banner").insertAdjacentHTML("beforeend", `<div class="alert av-b" id="avB">${ico("bell")} <span><b>Activa los avisos:</b> ${ADMIN ? "te avisamos de negocios, repartidores, pagos y reclamos nuevos" : "te sonará cada pedido nuevo aunque cierres el panel"}.</span><button class="btn btn-pri btn-sm" id="avOk">Activar</button><button class="btn btn-light btn-sm" id="avNo">Ahora no</button></div>`);
  $("#avOk").onclick = async () => { $("#avOk").disabled = true; const r = await activarAvisos("panel"); toast(textoAvisos(r), r !== "ok"); if (r === "ok") $("#avB").remove(); else $("#avOk").disabled = false; };
  $("#avNo").onclick = () => { store.set("am_noavisos", Date.now() + 864e5); $("#avB").remove(); };
}
function armar(nav, inicio) {
  document.body.innerHTML = `<div class="shell"><aside class="side" id="side"><div class="s-brand"><img class="s-logo" src="favicon.svg" alt=""><div><b></b><small>${ADMIN ? "Administrador" : "Panel del negocio"}</small></div></div>
      <nav class="s-nav">${nav.map(([k, i, t]) => `<button data-v="${k}">${ico(i)}<span>${t}</span><b class="cnt" id="cnt-${k}" hidden></b></button>`).join("")}</nav>
      <div class="s-user"><small>Sesión</small><b>${esc(YO.email)}</b>${DEMO ? `<span class="st warn">MODO DEMO</span>` : ""}<button class="btn btn-light btn-sm" id="salir">${ico("logout")} Salir</button></div></aside>
    <div class="main"><header class="tb"><button class="tb-m" id="menuB" aria-label="Menú">${ico("menu")}</button><span class="tb-f">${fmtF(HOY(), { weekday: "long", day: "numeric", month: "long" })}</span>
      ${!ADMIN && NEG.estado === "activo" ? `<button class="btn btn-sm tb-ab" id="abierto"></button>` : ""}</header><div id="banner"></div><main id="view" class="view" tabindex="-1"></main></div></div>`;
  marcaPanel(); pintarAbierto(); bannerEstado(); bannerAvisos();
  $(".s-nav").onclick = e => { const b = e.target.closest("[data-v]"); if (b) go(b.dataset.v); };
  $("#salir").onclick = () => Sesion.salir(); $("#menuB").onclick = () => $("#side").classList.toggle("open");
  $("#abierto")?.addEventListener("click", cambiarAbierto);
  document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });
  go(inicio); if (!ADMIN && NEG.estado === "activo") { vigilar(); if (BQ_RUBROS.includes(NEG.rubro)) vigilarSol(); } if (ADMIN) vigilarAdm();
}
function marcaPanel() { const b = $(".s-brand"); if (!b) return; b.querySelector("b").textContent = ADMIN ? "Apamuy" : NEG.nombre; if (!ADMIN && NEG.logo) b.querySelector("img").src = NEG.logo; }
function bannerEstado() {
  const B = $("#banner"); if (!B || ADMIN) return;
  B.innerHTML = { pendiente: `<div class="alert warn">${ico("clock")} <span><b>Tu negocio está en revisión.</b> Mientras tanto arma tu carta: cuando lo aprobemos aparecerá en la app.</span></div>`,
    rechazado: `<div class="alert bad">${ico("alert")} <span><b>No pudimos aprobar tu negocio.</b> ${esc(NEG.motivo || "")} Corrige tus datos en «Mi negocio» o escríbenos.</span></div>`,
    suspendido: `<div class="alert bad">${ico("alert")} <span><b>Tu negocio está suspendido y no aparece en la app.</b> ${esc(NEG.motivo || "")}</span></div>` }[NEG.estado] || "";
}
function pintarAbierto() { const b = $("#abierto"); if (!b) return; const ab = estaAbierto(NEG), m = NEG.estadoManual || "auto"; b.className = "btn btn-sm tb-ab " + (ab ? "on" : "off"); b.innerHTML = `<i></i>${ab ? "Abierto" : "Cerrado"}${m === "auto" ? " · por horario" : " · manual"}`; }
function cambiarAbierto() {
  const m = NEG.estadoManual || "auto";
  modal("¿Recibir pedidos en la app?", `<p class="muted">Con «Según horario» abre y cierra solo (${esc(NEG.abre)} a ${esc(NEG.cierra)}).</p><div class="radios">${[["auto", "🕑 Según horario"], ["abierto", "🟢 Abierto ahora"], ["cerrado", "🔴 Cerrado ahora (mucha demanda, se acabó, etc.)"]].map(([v, t]) => `<label class="rd"><input type="radio" name="estadoManual" value="${v}" ${m === v ? "checked" : ""}><span>${t}</span></label>`).join("")}</div>`,
    async d => { await DB.set("negocios", NEG.id, { estadoManual: d.estadoManual }); NEG.estadoManual = d.estadoManual; pintarAbierto(); toast("Listo · la app ya lo muestra"); });
}
async function go(v) {
  VISTA = v; $$(".s-nav button").forEach(b => b.setAttribute("aria-current", b.dataset.v === v ? "page" : "false")); $("#side")?.classList.remove("open");
  if (PARAR) { PARAR(); PARAR = null; }
  $("#view").innerHTML = `<div class="loading"><span class="spin"></span></div>`;
  try { await VIEWS[v](); } catch (e) { console.error(e); $("#view").innerHTML = `<div class="empty">${ico("alert")}<p>No se pudo cargar: ${esc(e.code || e.message)}</p></div>`; }
}
let PARAR = null;   // detiene la escucha en vivo de la vista anterior

/* ================= NEGOCIO · avisos de pedidos nuevos ================= */
const ACTIVOS = ["por-validar", "nuevo", "cocina", "listo", "camino"];
let ULT = null, PEDS = [];
function vigilar() {
  DB.escucharLista("pedidos", [["negocioId", "==", NEG.id], ["estado", "in", ACTIVOS]], l => {
    PEDS = l; const n = l.filter(p => ["por-validar", "nuevo"].includes(p.estado)).length, b = $("#cnt-pedidos");
    if (b) { b.textContent = n; b.hidden = !n; } document.title = n ? `(${n}) Panel · Apamuy` : "Panel · Apamuy";
    if (ULT !== null && n > ULT) { beep(3); toast("🔔 ¡Nuevo pedido!"); }
    ULT = n; if (VISTA === "pedidos" && !$("#modal.open")) VIEWS.pedidos(true); if (VISTA === "inicio" && !$("#modal.open")) VIEWS.inicio(true);
  });
}

/* ================= NEGOCIO · 🔍 BUSCAN REPUESTOS y 🚨 AUXILIO =================
   Al cliente le llega lo que respondas: precio, calidad, nota y foto. Si te elige, te llega como pedido normal. */
const BQ_RUBROS = ["ferreteria", "talleres"], AUX_KM = 30;
let SOLS = [], SOLS_T = [], VSOL = null, MISR = {};
const solVisible = s => s.rubros && s.rubros.includes(NEG.rubro) && new Date(s.vence) > Date.now() && s.clienteUid !== NEG.id
  && (s.tipo !== "auxilio" || (NEG.ubic && s.ubic && distanciaKm(NEG.ubic, s.ubic) <= AUX_KM));
function filtrarSol() {
  const antes = new Set(SOLS.map(s => s.id)); SOLS = SOLS_T.filter(solVisible).sort((a, b) => String(b.creado).localeCompare(a.creado));
  const sin = SOLS.filter(s => !MISR[s.id]).length, b = $("#cnt-solicitudes"); if (b) { b.textContent = sin; b.hidden = !sin; }
  const nuevas = VSOL ? SOLS.filter(s => !antes.has(s.id) && !VSOL.has(s.id)) : []; VSOL = new Set([...(VSOL || []), ...SOLS.map(s => s.id)]);
  if (nuevas.length) { beep(nuevas.some(s => s.tipo === "auxilio") ? 4 : 2); toast(nuevas[0].tipo === "auxilio" ? "🚨 ¡Piden auxilio mecánico cerca!" : "🔍 Un cliente busca: " + nuevas[0].texto.slice(0, 50)); }
  if (VISTA === "solicitudes" && !$("#modal.open")) VIEWS.solicitudes(true);
}
function vigilarSol() {
  MISR = store.get("am_misr_" + NEG.id, {});
  DB.escucharLista("solicitudes", [["prov", "==", NEG.prov], ["estado", "==", "abierta"]], l => { SOLS_T = l; filtrarSol(); });
  setInterval(filtrarSol, 20000);   // se van las que vencen
}
VIEWS.solicitudes = async () => {
  const aux = NEG.rubro === "talleres", resta = s => Math.max(0, Math.round((new Date(s.vence) - Date.now()) / 60000));
  $("#view").innerHTML = topBar(aux ? "Repuestos y auxilio" : "Clientes buscando repuestos", `Clientes de tu provincia preguntan por algo. Si lo tienes, responde con tu precio: el cliente compara y elige. Si te elige, te llega como pedido.${aux ? ` El auxilio llega de clientes a ${AUX_KM} km o menos.` : ""}`)
    + (SOLS.length ? `<div class="sols">${SOLS.map(s => { const m = MISR[s.id], km = NEG.ubic && s.ubic ? distanciaKm(NEG.ubic, s.ubic) : null;
      return `<article class="card sol ${s.tipo === "auxilio" ? "aux" : ""} ${m ? "resp" : ""}"><div class="sol-h"><span class="st ${s.tipo === "auxilio" ? "bad" : "warn"}">${s.tipo === "auxilio" ? "🚨 Auxilio mecánico" : "🔍 Busca"}</span><small>${hace(s.creado)} · quedan ${resta(s)} min</small></div>
        <div class="sol-b">${s.foto ? `<img src="${esc(s.foto)}" alt="" class="sol-f">` : ""}<div><h3>${esc(s.texto)}</h3>
          <p class="muted sm">${s.vehiculo ? `${esc(vehTxtSol(s.vehiculo))} · ` : ""}👤 ${esc(s.cliente || "Cliente")}${s.zona ? ` · 📍 ${esc(s.zona)}` : ""}${km != null ? ` · a ~${km < 10 ? km.toFixed(1) : Math.round(km)} km de tu local` : ""}</p></div></div>
        ${m ? `<div class="alert ok sm">${ico("check")} <span>Respondiste <b>${S(m.precio)}</b>${m.llegaMin ? ` · llegas en ~${m.llegaMin} min` : ""}. Si el cliente te elige, te llega a «Pedidos».</span></div>` : ""}
        <div class="acts-g"><button class="btn ${m ? "btn-light" : "btn-pri"}" data-sol="${esc(s.id)}">${m ? `${ico("edit")} Cambiar mi respuesta` : s.tipo === "auxilio" ? "🚨 Puedo ir" : "✋ Sí tengo"}</button></div></article>`; }).join("")}</div>`
      : `<div class="card">${vacio(`Ahora no hay clientes buscando. Cuando alguien pregunte${aux ? " o pida auxilio cerca" : ""}, suena y aparece aquí.`)}</div>`);
  $("#view").onclick = e => { const b = e.target.closest("[data-sol]"); if (b) responderSol(SOLS.find(s => s.id === b.dataset.sol)); };
};
const vehTxtSol = v => [{ moto: "🛵 Moto", mototaxi: "🛺 Mototaxi", auto: "🚗 Auto", camioneta: "🛻 Camioneta", camion: "🚚 Camión", otro: "Vehículo" }[v.tipo] || v.tipo, v.modelo, v.anio].filter(Boolean).join(" ");
function responderSol(s) {
  if (!s) return; const aux = s.tipo === "auxilio", m = MISR[s.id] || {}; let FOTO = m.foto || "";
  modal(aux ? "Puedo ir al auxilio" : "Sí tengo", `<p class="muted"><b>${esc(s.texto)}</b>${s.vehiculo ? `<br>${esc(vehTxtSol(s.vehiculo))}` : ""}</p><div class="g2">
    ${fld("precio", aux ? "Precio estimado (S/)" : "Precio (S/)", m.precio ?? "", { type: "number", req: true, extra: 'min="0.5" step="0.5"' })}
    ${aux ? fld("llegaMin", "¿En cuántos minutos llegas?", m.llegaMin ?? "", { type: "number", req: true, extra: 'min="5" max="240" step="5"' })
      : fld("calidad", "Calidad", m.calidad || "Original", { opts: ["Original", "Alternativo", "Genérico", "Usado", "Nacional", "Importado"] })}
    ${fld("nota", "Nota para el cliente", m.nota || "", { full: true, ph: aux ? "Ej. llevo gata y compresora" : "Ej. tengo 3 en stock, marca Bosch, con garantía" })}</div>
    ${aux ? "" : `<div class="fld"><span>Foto del producto (opcional)</span><div class="foto-up"><span class="fp-logo" id="solFv" style="background-image:url('${esc(FOTO)}')"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir foto<input type="file" accept="image/*" id="solF" hidden></label></div></div>`}
    <p class="muted sm">El cliente verá tu precio, el nombre de tu negocio y tu distrito. Su nombre completo y celular los ves si te elige.</p>`,
    async d => {
      if (!(+d.precio > 0)) { toast("Pon tu precio", true); return false; }
      const r = { negocioId: NEG.id, negocio: { nombre: NEG.nombre, logo: NEG.logo || "", distrito: NEG.distrito || "", direccion: NEG.direccion || "", ubic: NEG.ubic || null, delivery: NEG.delivery !== false, recojo: NEG.recojo !== false, radioKm: NEG.radioKm || 0, rubro: NEG.rubro, prov: NEG.prov },
        precio: Math.round(+d.precio * 10) / 10, calidad: aux ? "" : d.calidad, nota: (d.nota || "").slice(0, 200), foto: aux ? "" : FOTO, llegaMin: aux ? Math.round(+d.llegaMin) || null : null, creado: m.creado || new Date().toISOString(), actualizado: new Date().toISOString() };
      await DB.set(`solicitudes/${s.id}/respuestas`, NEG.id, r, false);
      MISR[s.id] = { precio: r.precio, calidad: r.calidad, nota: r.nota, foto: r.foto, llegaMin: r.llegaMin, creado: r.creado };
      for (const k of Object.keys(MISR)) if (!SOLS_T.some(x => x.id === k)) delete MISR[k];   // limpia las viejas
      store.set("am_misr_" + NEG.id, MISR); toast("✅ Respuesta enviada al cliente"); filtrarSol();
    }, "Enviar respuesta", { alAbrir: F => { const i = $("#solF", F); if (i) i.onchange = async e => { const f = e.target.files[0]; if (!f) return; FOTO = await redimensionar(f, 700, .72); $("#solFv").style.backgroundImage = `url('${FOTO}')`; }; } });
}

/* ================= NEGOCIO · INICIO ================= */
VIEWS.inicio = async () => {
  const hoy = (await DB.list("pedidos", ["negocioId", "==", NEG.id], ["dia", "==", HOY()])).filter(p => !["anulado", "rechazado"].includes(p.estado));
  const ent = hoy.filter(p => p.estado === "entregado"), ventas = ent.reduce((a, p) => a + (+(p.montoFinal ?? p.subtotal) || 0), 0);
  $("#view").innerHTML = topBar(`Hola, ${esc(NEG.nombre)}`, "Así va tu negocio hoy.", NEG.estado === "activo" ? `<a class="btn btn-light btn-sm" href="${esc(AP.web)}/negocio?n=${encodeURIComponent(NEG.id)}" target="_blank" rel="noopener">${ico("arrow")} Ver mi tienda en la app</a>` : "") + `
    <div class="kpis neon"><div class="kpi"><span>Ventas de hoy</span><b>${S(ventas)}</b><small>${ent.length} pedido(s) entregado(s)</small></div><div class="kpi"><span>Pedidos de hoy</span><b>${hoy.length}</b><small>sin contar anulados</small></div>
      <div class="kpi"><span>Por atender</span><b>${PEDS.filter(p => ["por-validar", "nuevo"].includes(p.estado)).length}</b><small>nuevos o por validar</small></div><div class="kpi"><span>En curso</span><b>${PEDS.length}</b><small>preparando, listos o en camino</small></div>
      <div class="kpi"><span>Comisión de hoy</span><b>${S(ventas * pctDe(NEG) / 100)}</b><small>${pctDe(NEG)}% de la comida entregada</small></div></div>
    <section class="card"><div class="card-h"><h2>${ico("bell")} Pedidos en curso</h2><button class="btn btn-light btn-sm" data-go="pedidos">Ver tablero</button></div>
      <ul class="lst">${PEDS.slice().sort((a, b) => String(a.creado).localeCompare(b.creado)).map(p => `<li><div><b>${p.entrega === "delivery" ? "🛵" : "🏪"} ${esc(p.cliente.nombre)} · ${S(p.total)}</b><small>${esc(p.codigo)} · ${hace(p.creado)}</small></div>${estP(p.estado, p)}</li>`).join("") || `<li class="muted">${NEG.estado === "activo" ? "No hay pedidos en curso." : "Cuando aprobemos tu negocio, aquí verás tus pedidos."}</li>`}</ul></section>`;
};

/* ================= NEGOCIO · PEDIDOS (tablero) ================= */
let PT = "activos", HIST_D = HOY(), PORCOB = null;
VIEWS.pedidos = async silencioso => {
  if (NEG.estado !== "activo") { $("#view").innerHTML = topBar("Pedidos", "") + vacio("Cuando tu negocio esté aprobado, aquí llegarán tus pedidos con sonido."); return; }
  const lista = PT === "activos" ? PEDS : (await DB.list("pedidos", ["negocioId", "==", NEG.id], ["dia", "==", HIST_D])).sort((a, b) => String(b.creado).localeCompare(a.creado));
  if (!silencioso || PORCOB === null) PORCOB = (await DB.list("pedidos", ["negocioId", "==", NEG.id], ["dia", "==", HOY()]).catch(() => [])).filter(p => p.estado === "entregado" && p.repUid && !p.pagado && p.pago === "Efectivo");
  const ops = {}; PEDS.forEach(p => { if (p.operacion) ops[p.operacion] = (ops[p.operacion] || 0) + 1; });
  const tarjeta = p => { const al = [], m = minDesde(p.creado);
    if (p.estado === "por-validar") { if (p.montoLeido == null) al.push(["warn", "No se pudo leer el monto de la captura."]); else if (p.coincide === false) al.push(["bad", `La captura dice ${S(p.montoLeido)}.`]); if (p.fechaOk === false) al.push(["bad", "La fecha de la captura no es de hoy."]); if (p.operacion && ops[p.operacion] > 1) al.push(["bad", "N° de operación repetido."]); }
    const tarde = ACTIVOS.includes(p.estado) && m >= (p.tiempo ? +p.tiempo + 10 : 40);
    return `<article class="card ped ${esc(p.estado)} ${tarde ? "tarde" : ""}"><div class="ped-b"><div class="ped-h"><span class="ent">${p.entrega === "servicio" ? "🔧 Servicio" : p.entrega === "delivery" ? "🛵 Delivery" : "🏪 Recojo"}</span><span class="mono">${esc(p.codigo)}</span>${PT === "activos" ? `<span class="reloj ${tarde ? "neg" : ""}">${ico("clock")} ${m} min</span>` : estP(p.estado, p)}</div>
      <b class="ped-n">${esc(p.cliente.nombre)} <a class="tel" href="tel:${esc(p.cliente.celular)}">📞 ${esc(p.cliente.celular)}</a></b>${p.mayorEdad ? `<span class="st warn">🔞 Pedir DNI al entregar</span>` : ""}
      ${p.servicio ? `<p class="ped-nota">🔧 ${esc(p.servicio.detalle)}<br><small>${p.servicio.auxilio ? `<b class="neg">🚨 AUXILIO MECÁNICO</b>${p.servicio.llegaMin ? ` · dijiste ~${p.servicio.llegaMin} min` : ""}` : p.servicio.lugar === "domicilio" ? "🏠 A domicilio" : "En el taller"}${p.servicio.fecha ? " · " + fmtFH(p.servicio.fecha) : ""}</small>
        ${p.servicio.auxilio && p.destino ? `<br><a class="btn btn-pri btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.destino.lat},${p.destino.lng}">${ico("map")} Cómo llegar</a>${p.destino.referencia ? ` <small>📍 ${esc(p.destino.referencia)}</small>` : ""}` : ""}</p>` : ""}<ul class="ped-it">${(p.items || []).map(i => `<li><b>${i.cant}×</b> ${esc(i.n)}${detItem(i).map(d => `<small>${esc(d)}</small>`).join("")}</li>`).join("")}</ul>
      ${p.nota ? `<p class="ped-nota">📝 ${esc(p.nota)}</p>` : ""}<p><b>${p.entrega === "servicio" ? "Precio" : (NEG.rubro || "comida") === "comida" ? "Comida" : "Productos"} ${S(p.subtotal)}</b>${p.envio ? ` · delivery ${S(p.envio)}` : ""} · ${esc(p.pago)}${p.pagaCon ? ` · paga con ${S(p.pagaCon)} → vuelto ${S(p.pagaCon - p.total)}` : ""}${p.pagado ? ` <span class="st ok">Pagado</span>` : ""}</p>
      ${p.entrega === "delivery" && p.destino ? `<p class="muted">📍 ${esc(p.destino.texto)}${p.destino.referencia ? " · " + esc(p.destino.referencia) : ""} · ${p.km} km · <a href="https://maps.google.com/?q=${p.destino.lat},${p.destino.lng}" target="_blank" rel="noopener">Ver mapa</a></p>` : ""}
      ${PT === "activos" ? lineaRep(p) : p.repartidor ? `<p class="rep-l">${vehTxt(p.repartidor.vehiculo)} ${esc(p.repartidor.nombre)}</p>` : ""}
      ${al.map(([c, t]) => `<div class="alert ${c} sm">${ico("alert")} ${t}</div>`).join("")}
      <div class="acts-g">${PT === "activos" ? accionesPedido(p) : ""}<button class="btn btn-light btn-sm" data-pa="comanda|${esc(p.id)}" title="Comanda para cocina">${ico("chef")}</button><button class="btn btn-wa btn-sm" data-pa="wa|${esc(p.id)}" title="WhatsApp al cliente">${ico("wa")}</button></div></div></article>`; };
  const COLS = [["Por atender", p => ["por-validar", "nuevo"].includes(p.estado)], [rubroDe(NEG.rubro).modo === "servicios" ? "En proceso" : "Preparando", p => p.estado === "cocina"], ["Listos", p => p.estado === "listo"], ["En camino", p => p.estado === "camino"]];
  const html = topBar("Pedidos", "Llegan solos y suenan. Avísale al cliente en cada paso.", `<div class="seg"><button class="${PT === "activos" ? "on" : ""}" data-pt="activos">En curso (${PEDS.length})</button><button class="${PT === "hist" ? "on" : ""}" data-pt="hist">Historial</button></div>${PT === "hist" ? `<input type="date" class="q" id="hD" value="${HIST_D}">` : ""}`)
    + (PT === "activos" ? (PEDS.some(p => p.estado === "por-validar") ? `<div class="alert warn">${ico("alert")} <span>Antes de validar, <b>confirma en tu app de Yape/Plin que el dinero llegó</b>. Una captura se puede editar.</span></div>` : "")
      + (PORCOB.length ? `<div class="alert warn">${ico("cash")} <span><b>Comida por cobrar a repartidores:</b> ${PORCOB.map(p => `${esc(p.repartidor?.nombre || "")} · ${esc(p.codigo)} · <b>${S(p.subtotal)}</b> <button class="btn btn-light btn-xs" data-pa="cobrarRep|${esc(p.id)}">Ya me pagó</button>`).join(" &nbsp; ")}</span></div>` : "")
      + `<div class="board">${COLS.map(([t, f]) => { const l = lista.filter(f).sort((a, b) => String(a.creado).localeCompare(b.creado)); return `<section class="col"><h3>${t} <b>${l.length}</b></h3>${l.map(tarjeta).join("") || `<p class="muted sm col-v">—</p>`}</section>`; }).join("")}</div>`
      : `<div class="peds">${lista.map(tarjeta).join("") || vacio("Sin pedidos ese día.")}</div>`);
  if (silencioso && $("#view").dataset.h === html) return; $("#view").innerHTML = html; $("#view").dataset.h = html;
  $("#hD")?.addEventListener("change", e => { HIST_D = e.target.value; VIEWS.pedidos(); });
  $("#view").onclick = e => { const t = e.target.closest("[data-pt]"); if (t) { PT = t.dataset.pt; return VIEWS.pedidos(); }
    const b = e.target.closest("[data-pa]"); if (!b) return; const [a, id] = b.dataset.pa.split("|"), p = lista.find(x => x.id === id) || PORCOB.find(x => x.id === id); if (p) accionPedido(a, p); };
};
function accionesPedido(p) {
  const B = (a, t, c = "btn-light") => `<button class="btn ${c} btn-sm" data-pa="${a}|${esc(p.id)}">${t}</button>`;
  if (p.entrega === "servicio") return { nuevo: B("aceptarS", `${ico("check")} Aceptar`, "btn-pri") + B("anular", "No puedo"), cocina: B("terminar", `${ico("check")} Terminado y cobrado`, "btn-pri") + B("anular", "Anular") }[p.estado] || "";
  return { "por-validar": B("validar", `${ico("check")} Ver captura y validar`, "btn-pri") + B("rechazar", "Rechazar"), nuevo: B("aceptar", `${ico("fire")} Aceptar`, "btn-pri") + B("anular", "Rechazar"),
    cocina: B("listo", `${ico("check")} Listo`, "btn-pri") + B("anular", "Anular"),
    listo: (p.entrega !== "delivery" ? B("entregar", `${ico("check")} Recogido${p.pagado ? "" : " y cobrado"}`, "btn-pri") : p.repartidor ? B("alRep", `${ico("bike")} Entregar a ${esc(p.repartidor.nombre.split(" ")[0])}`, "btn-pri") : B("salio", `${ico("bike")} Lo llevo yo`)) + B("anular", "Anular"),
    camino: p.repartidor ? (!p.pagado && p.pago === "Efectivo" ? B("cobrarRep", `${ico("cash")} Cobré la comida al repartidor`) : "") : B("entregar", `${ico("check")} Entregado${p.pagado ? "" : " y cobrado"}`, "btn-pri") }[p.estado] || "";
}
// Repartidor del pedido: quién lo lleva o si se está buscando uno
function lineaRep(p) {
  if (p.entrega !== "delivery" || ["por-validar", "nuevo"].includes(p.estado)) return "";
  const r = p.repartidor, X = (a, t) => `<button class="btn btn-light btn-xs" data-pa="${a}|${esc(p.id)}">${t}</button>`;
  if (r) return `<p class="rep-l">${vehTxt(r.vehiculo)} <b>${esc(r.nombre)}</b>${r.placa ? " · " + esc(r.placa) : ""} · <a href="tel:${esc(r.celular)}">📞 ${esc(r.celular)}</a>${p.estado !== "camino" ? ` <span class="st info">va a tu local</span> ${X("quitarRep", "Quitar")}` : ""}</p>`;
  if (p.oferta) return `<p class="rep-l busca">🔎 Buscando repartidor${p.vehiculo === "carro" ? " con <b>carro</b>" : p.vehiculo === "moto" ? " con <b>moto</b>" : ""}… ${X("reavisar", "Volver a avisar")}</p>`;
  return `<p class="rep-l">${X("pedirRep", "🛵 Pedir repartidor")}</p>`;
}
// Ferretería y Talleres: el negocio elige el tamaño del envío
const campoTam = p => p.entrega === "delivery" && envioGrande(NEG.rubro) ? `<span class="lbl">Tamaño del envío</span><div class="radios">${[["carro", "🚗 Grande · va en carro"], ["moto", "🛵 Pequeño · va solo en moto"]].map(([v, t], i) => `<label class="rd"><input type="radio" name="tam" value="${v}" ${i ? "" : "checked"}><span>${t}</span></label>`).join("")}</div>` : "";
// Aviso a los repartidores de la ciudad (solo ven negocio, zona y distancia; NO los datos del cliente)
function opOferta(p, veh, tiempo, n = NEG) {
  const z = p.destino ? ciudadCercana(p.destino) : null;
  return [{ op: "set", col: "ofertas", id: p.id, merge: false, data: { codigo: p.codigo, negocioId: n.id, prov: n.prov, negocio: { nombre: n.nombre, direccion: n.direccion || "", ubic: n.ubic || null, telefono: n.telefono || "" },
      zona: z ? z.dis : "", zonaUbic: p.destino ? { lat: Math.round(p.destino.lat * 100) / 100, lng: Math.round(p.destino.lng * 100) / 100 } : null,   // zona aprox. (~1 km), no la casa
      km: p.km ?? null, envio: +p.envio || 0, pago: p.pago, vehiculo: veh || "todos", tiempo: tiempo || p.tiempo || null, anillos: anillosDe(n.rubro), estado: "libre", creado: new Date().toISOString(), dia: HOY() } },
    { op: "set", col: "pedidos", id: p.id, data: { oferta: true, vehiculo: veh || "todos" } }];
}
const cerrarOferta = p => p.oferta ? [{ op: "set", col: "ofertas", id: p.id, data: { estado: "cerrada" } }] : [];
const msgCli = (p, t) => `Hola ${String(p.cliente.nombre || "").split(" ")[0]} 👋 te escribe *${NEG.nombre}* por tu pedido de Apamuy.\n\n${t}\n\nSigue tu pedido aquí: ${AP.web}/pedido?c=${encodeURIComponent(p.codigo)}`;
function movimiento(m) { return { op: "set", col: `negocios/${NEG.id}/movimientos`, id: codigo("MV"), data: { fecha: HOY(), hora: new Date().toISOString(), ...m, monto: r2(m.monto) } }; }
async function accionPedido(a, p) {
  const upd = data => ({ op: "set", col: "pedidos", id: p.id, data: { ...data, actualizado: new Date().toISOString() } });
  const fin = async (ops, msg, w) => { await DB.batch(ops); toast(msg); if (w) abrirWA(p.cliente.celular, w); };
  if (a === "comanda") return comanda(p);
  if (a === "wa") return abrirWA(p.cliente.celular, msgCli(p, "Te escribimos sobre tu pedido."));
  if (a === "validar") return modal(`Validar pago · ${p.codigo}`, `${p.captura ? `<img class="zoom" src="${esc(p.captura)}" alt="Captura del pago">` : `<p class="muted">Sin captura.</p>`}<p>Confirma que te llegaron <b>${S(p.subtotal)}</b> por ${esc(p.pago)}${p.operacion ? ` (op. ${esc(p.operacion)})` : ""}.</p>
    <div class="g2">${fld("tiempo", "Listo en (min)", 25, { opts: [15, 20, 25, 30, 40, 50] })}${fld("enviar", "Avisar al cliente por WhatsApp", false, { type: "checkbox" })}</div>${campoTam(p)}`, async d =>
    fin([upd({ estado: "cocina", pagado: p.subtotal, tiempo: +d.tiempo, validado: new Date().toISOString() }), movimiento({ concepto: `Pedido ${p.codigo} · ${p.cliente.nombre}`, monto: p.subtotal, metodo: p.pago, pedido: p.id }), ...(p.entrega === "delivery" ? opOferta(p, d.tam, +d.tiempo) : [])],
      p.entrega === "delivery" ? "Pago validado · avisamos a los repartidores 🛵" : "Pago validado · a preparar", d.enviar ? msgCli(p, `✅ Recibimos tu pago. Ya estamos preparando tu pedido 🔥 (aprox. ${d.tiempo} min).`) : null), "Validar y preparar");
  if (a === "rechazar") return modal("Rechazar pago", fld("motivo", "Motivo", "No llegó el pago", { full: true, opts: ["No llegó el pago", "El monto no coincide", "La captura no se lee", "La captura es de otro pago"] }), async d => fin([upd({ estado: "rechazado", motivo: d.motivo })], "Pedido rechazado"), "Rechazar");
  if (a === "aceptar") return modal(`Aceptar · ${p.codigo}`, `<p>¿En cuántos minutos estará listo? El cliente lo ve en su seguimiento.</p><div class="tiempos">${[15, 20, 25, 30, 40, 50].map(t => `<label class="rd"><input type="radio" name="tiempo" value="${t}" ${t === 25 ? "checked" : ""}><span>${t} min</span></label>`).join("")}</div>${campoTam(p)}${fld("imprimir", "Imprimir comanda para cocina", true, { type: "checkbox" })}${p.entrega === "delivery" ? `<p class="muted sm">🛵 Al aceptar avisamos a los repartidores de tu ciudad. El primero que acepte viene a tu local.</p>` : ""}`,
    async d => { if (d.imprimir) comanda(p); await fin([upd({ estado: "cocina", tiempo: +d.tiempo, aceptado: new Date().toISOString() }), ...(p.entrega === "delivery" ? opOferta(p, d.tam, +d.tiempo) : [])], p.entrega === "delivery" ? "Pedido aceptado 🔥 · buscando repartidor" : "Pedido aceptado 🔥"); }, "Aceptar pedido");
  if (a === "aceptarS") { await fin([upd({ estado: "cocina", aceptado: new Date().toISOString() })], "Solicitud aceptada"); return modal("Llama al cliente", `<p>Coordina el servicio con <b>${esc(p.cliente.nombre)}</b>.</p><a class="btn btn-pri btn-lg" href="tel:${esc(p.cliente.celular)}">📞 Llamar al ${esc(p.cliente.celular)}</a>`, null); }
  if (a === "terminar") return modal(`Terminar · ${p.codigo}`, `${fld("monto", "¿Cuánto cobraste? (S/)", p.subtotal, { type: "number", req: true, extra: 'min="0" step="0.1"' })}${fld("metodo", "Método", "Efectivo", { opts: METODOS })}`, async d =>
    fin([upd({ estado: "entregado", pagado: +d.monto, montoFinal: +d.monto, pagoReal: d.metodo, entregado: new Date().toISOString() }), movimiento({ concepto: `Servicio ${p.codigo} · ${p.cliente.nombre}`, monto: +d.monto, metodo: d.metodo, pedido: p.id })], "Servicio terminado"), "Terminado");
  if (a === "listo") return fin([upd({ estado: "listo", listo: new Date().toISOString() })], p.entrega === "delivery" ? "Listo · esperando al repartidor" : "Listo para recoger");
  if (a === "salio") return fin([upd({ estado: "camino", despachado: new Date().toISOString() }), ...cerrarOferta(p)], "Pedido en camino 🛵");
  if (a === "pedirRep") { const go = async veh => fin(opOferta(p, veh), "Avisamos a los repartidores 🛵"); return campoTam(p) ? modal("Pedir repartidor", campoTam(p), d => go(d.tam), "Avisar") : go("todos"); }
  if (a === "reavisar") return fin([{ op: "set", col: "ofertas", id: p.id, data: { estado: "libre", tomadoPor: null, creado: new Date().toISOString() } }], "Volvimos a avisar a los repartidores");
  if (a === "quitarRep") return modal("Quitar repartidor", `<p>¿<b>${esc(p.repartidor.nombre)}</b> no llegó? El pedido vuelve a la lista para que lo tome otro repartidor.</p>`, async () =>
    fin([upd({ repUid: null, repartidor: null }), { op: "set", col: "ofertas", id: p.id, data: { estado: "libre", tomadoPor: null, creado: new Date().toISOString() } }], "Buscando otro repartidor"), "Quitar");
  if (a === "alRep" || a === "cobrarRep") {
    const sale = a === "alRep" ? [upd({ estado: "camino", despachado: new Date().toISOString(), repartidor: { etapa: "camino", recogido: new Date().toISOString() } })] : [];
    if (p.pagado || p.pago !== "Efectivo") return fin(sale, `Pedido en camino con ${p.repartidor.nombre.split(" ")[0]} 🛵`);
    return modal(a === "alRep" ? `Entregar a ${p.repartidor.nombre.split(" ")[0]}` : "Cobrar la comida", `<p>El cliente paga en efectivo: <b>${esc(p.repartidor.nombre)}</b> le cobra ${S(p.total)}. La comida (<b>${S(p.subtotal)}</b>) es tuya.</p>
      ${fld("metodo", "¿Cómo te pagó la comida el repartidor?", "Efectivo", { opts: [...METODOS, ["despues", "Me paga después"]] })}`, async d => {
      if (d.metodo === "despues") return fin(sale, "Listo · queda pendiente de cobro");
      await fin([...sale, { ...upd({ pagado: p.subtotal, pagoReal: d.metodo, cobradoRep: new Date().toISOString() }) }, movimiento({ concepto: `Pedido ${p.codigo} · cobrado a ${p.repartidor.nombre}`, monto: p.subtotal, metodo: d.metodo, pedido: p.id })], "Comida cobrada");
      PORCOB = PORCOB.filter(x => x.id !== p.id); VIEWS.pedidos(); }, a === "alRep" ? "Entregar" : "Cobrado"); }
  if (a === "entregar") {
    if (p.pagado) return fin([upd({ estado: "entregado", entregado: new Date().toISOString() }), ...cerrarOferta(p)], "Pedido entregado");
    return modal(`Cobrar · ${p.codigo}`, `<p>Comida: <b>${S(p.subtotal)}</b>${p.envio ? ` · el delivery (${S(p.envio)}) es para quien lo llevó` : ""}.</p>${fld("metodo", "¿Cómo pagó la comida?", METODOS.includes(p.pago) ? p.pago : "Efectivo", { opts: METODOS })}`, async d =>
      fin([upd({ estado: "entregado", pagado: p.subtotal, pagoReal: d.metodo, entregado: new Date().toISOString() }), ...cerrarOferta(p), movimiento({ concepto: `Pedido ${p.codigo} · ${p.cliente.nombre}`, monto: p.subtotal, metodo: d.metodo, pedido: p.id })], "Entregado y cobrado"), "Entregado");
  }
  if (a === "anular") return modal(`Anular ${p.codigo}`, `${fld("motivo", "Motivo (lo ve el cliente)", "", { full: true, req: true, ph: "Ej. se nos acabó el pollo" })}${p.pagado ? `<div class="alert warn sm">${ico("cash")} <span>Ya te pagó ${S(p.pagado)}: devuélvele el dinero por ${esc(p.pago)}.</span></div>` : ""}`, async d =>
    fin([upd({ estado: "anulado", motivo: d.motivo }), ...cerrarOferta(p), ...(p.pagado ? [movimiento({ concepto: `Devolución ${p.codigo}`, monto: -p.pagado, metodo: p.pago, pedido: p.id })] : [])], "Pedido anulado", msgCli(p, `Lo sentimos, tuvimos que anular tu pedido: ${d.motivo}.`)), "Anular pedido");
}
// Comanda de cocina en PDF de 80 mm
async function comanda(p) {
  try { await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"); } catch (e) { return toast("No se pudo cargar el PDF. Revisa tu internet.", true); }
  const lin = (p.items || []).reduce((a, i) => a + 1 + detItem(i).length, 0), doc = new window.jspdf.jsPDF({ unit: "mm", format: [80, Math.max(110, 60 + lin * 7)] }); let y = 9;
  const C = (t, s, b) => { doc.setFont("helvetica", b ? "bold" : "normal"); doc.setFontSize(s); doc.text(String(t), 40, y, { align: "center", maxWidth: 72 }); };
  C("COMANDA · " + NEG.nombre, 11, true); y += 6; C(p.codigo, 10, true); y += 5; C(`${p.entrega === "delivery" ? "DELIVERY" : "RECOJO"} · ${fmtH(p.creado)} · ${p.cliente.nombre}`, 9); y += 5;
  doc.setLineDashPattern([1, 1], 0); doc.line(4, y, 76, y); y += 6;
  (p.items || []).forEach(i => { doc.setFont("helvetica", "bold"); doc.setFontSize(12); const t = doc.splitTextToSize(`${i.cant} x ${i.n}`, 70); doc.text(t, 5, y); y += 5.5 * t.length;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); detItem(i).forEach(d => { const l = doc.splitTextToSize("· " + d, 68); doc.text(l, 8, y); y += 4.6 * l.length; }); y += 3; });
  if (p.nota) { doc.line(4, y, 76, y); y += 5; doc.setFont("helvetica", "bold"); doc.text(doc.splitTextToSize("NOTA: " + p.nota, 70), 5, y); }
  doc.save(`Comanda-${p.codigo}.pdf`);
}

/* ================= NEGOCIO · CARTA ================= */
let CATS = [], PRODS = [], PQ = "";
async function cargarCarta() { [CATS, PRODS] = await Promise.all([DB.list(`negocios/${NEG.id}/categorias`), DB.list(`negocios/${NEG.id}/productos`)]); CATS.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)); PRODS.sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)); }
VIEWS.carta = async () => {
  await cargarCarta(); const l = PRODS.filter(p => norm(p.nombre).includes(norm(PQ))), cn = id => (CATS.find(c => c.id === id) || {}).nombre || "Sin categoría";
  const SV = rubroDe(NEG.rubro).modo === "servicios";
  $("#view").innerHTML = topBar(SV ? "Servicios y precios" : "Carta y precios", SV ? "Tus servicios con su precio «desde». El cliente te envía una solicitud y te llama." : "Lo que cambies aquí se ve al instante en la app.", `<button class="btn btn-light btn-sm" id="nCat">${ico("grid")} Categorías (${CATS.length})</button><button class="btn btn-pri btn-sm" id="nPl">${ico("plus")} Plato</button>`) + `
    ${!CATS.length ? `<div class="alert warn">${ico("alert")} <span>Primero crea tus <b>categorías</b> (ej. Pollos, Combos, Bebidas) y luego agrega tus platos.</span></div>` : ""}
    <section class="card"><div class="card-h"><input class="q" id="pq" placeholder="Buscar plato…" value="${esc(PQ)}"><span class="muted sm">${l.length} plato(s)</span></div>
      <div class="tbl-w"><table class="tbl"><thead><tr><th></th><th>Plato</th><th>Categoría</th><th class="r">${SV ? "Desde" : "Precio"}</th><th>${SV ? "Disponible" : "Hay hoy"}</th><th>Visible</th><th></th></tr></thead><tbody>
      ${l.map(p => `<tr class="${p.activo === false ? "off" : ""}"><td>${p.foto ? `<span class="p-th" style="background-image:url('${esc(p.foto)}')"></span>` : `<span class="p-th em">🍽️</span>`}</td><td><b>${esc(p.nombre)}</b><small>${(p.opciones || []).map(g => esc(g.titulo)).join(" · ") || "sin opciones"}</small></td><td>${esc(cn(p.cat))}</td>
        <td class="r"><input class="q precio" type="number" min="0" step="0.1" value="${p.precio}" data-pr="${esc(p.id)}" aria-label="Precio de ${esc(p.nombre)}"></td>
        <td><label class="sw"><input type="checkbox" data-hay="${esc(p.id)}" ${p.agotado ? "" : "checked"}><i></i><span>${p.agotado ? "Agotado" : "Sí"}</span></label></td><td><label class="sw"><input type="checkbox" data-vis="${esc(p.id)}" ${p.activo === false ? "" : "checked"}><i></i></label></td>
        <td><button class="btn btn-light btn-sm" data-ep="${esc(p.id)}" aria-label="Editar">${ico("edit")}</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Aún no tienes platos.</td></tr>`}</tbody></table></div></section>`;
  const col = `negocios/${NEG.id}/productos`;
  $("#pq").onchange = e => { PQ = e.target.value; VIEWS.carta(); }; $("#nPl").onclick = () => CATS.length ? formPlato() : formCats(); $("#nCat").onclick = formCats;
  $("#view").onclick = e => { const b = e.target.closest("[data-ep]"); if (b) formPlato(PRODS.find(p => p.id === b.dataset.ep)); };
  $("#view").onchange = async e => { const t = e.target, p = PRODS.find(x => x.id === (t.dataset.hay || t.dataset.vis || t.dataset.pr)); if (!p) return;
    if (t.dataset.hay) { await DB.set(col, p.id, { agotado: !t.checked }); t.nextElementSibling.nextElementSibling.textContent = t.checked ? "Sí" : "Agotado"; toast(t.checked ? "Disponible" : "Agotado en la app"); }
    if (t.dataset.vis) { await DB.set(col, p.id, { activo: t.checked }); t.closest("tr").classList.toggle("off", !t.checked); toast(t.checked ? "Visible en la app" : "Oculto en la app"); }
    if (t.dataset.pr) { const v = r2(t.value); if (!(v > 0)) { t.value = p.precio; return toast("Precio no válido", true); } await DB.set(col, p.id, { precio: v }); p.precio = v; toast(`${p.nombre}: ${S(v)}`); } };
};
function formCats() {
  modal("Categorías de tu carta", `<p class="muted sm">Una por línea, en el orden en que se verán en la app. Ej.: Pollos, Combos, Bebidas, Postres.</p>${fld("lista", "Categorías", CATS.map(c => c.nombre).join("\n"), { type: "textarea", full: true, rows: 8 })}`, async d => {
    const nombres = d.lista.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30), col = `negocios/${NEG.id}/categorias`, ops = [];
    nombres.forEach((n, i) => { const ex = CATS.find(c => c.nombre === n), id = ex ? ex.id : (slug(n) || "cat") + "-" + Date.now().toString(36).slice(-4); ops.push({ op: "set", col, id, data: { nombre: n, orden: i } }); });
    const quitar = CATS.filter(c => !nombres.includes(c.nombre)); const usadas = quitar.filter(c => PRODS.some(p => p.cat === c.id));
    if (usadas.length) { toast(`«${usadas[0].nombre}» tiene platos. Muévelos antes de quitarla.`, true); return false; }
    quitar.forEach(c => ops.push({ op: "del", col, id: c.id })); await DB.batch(ops); toast("Categorías guardadas"); VIEWS.carta(); }, "Guardar");
}
const gruposTxt = g => (g.items || []).map(i => i.n + (+i.p ? ` | ${i.p}` : "")).join("\n");
function formPlato(p) {
  let G = JSON.parse(JSON.stringify(p?.opciones || [])), FOTO = p?.foto || "", leerG = () => {};
  const plant = {}; PRODS.forEach(x => (x.opciones || []).forEach(g => { const k = g.titulo + "|" + gruposTxt(g); if (!plant[k]) plant[k] = g; }));
  modal(p ? "Editar plato" : "Nuevo plato", `<div class="g2"><div class="full"><span class="lbl">Foto</span><div class="foto-up"><span id="fPrev" style="background-image:url('${esc(FOTO)}')"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir foto<input type="file" accept="image/*" id="fFile" hidden></label><button type="button" class="btn btn-light btn-sm" id="fX">Quitar</button></div></div>
    ${fld("nombre", "Nombre", p?.nombre || "", { req: true, full: true })}${fld("cat", "Categoría", p?.cat || CATS[0]?.id, { opts: CATS.map(c => [c.id, c.nombre]) })}${fld("precio", rubroDe(NEG.rubro).modo === "servicios" ? "Precio desde (S/)" : "Precio (S/)", p?.precio ?? "", { type: "number", req: true, extra: 'min="0" step="0.1"' })}
    ${fld("desc", "Descripción corta", p?.desc || "", { type: "textarea", full: true, rows: 2 })}
    ${fld("destacado", "⭐ Favorito (sale arriba)", !!p?.destacado, { type: "checkbox" })}${fld("sugerirBebida", "Ofrecer bebida al agregarlo", p ? !!p.sugerirBebida : false, { type: "checkbox" })}
    ${(NEG.extrasGratis || []).length ? fld("extrasGratis", `Ofrecer extras gratis (${esc(NEG.extrasGratis.slice(0, 3).join(", "))}…)`, !!p?.extrasGratis, { type: "checkbox" }) : ""}${fld("agotado", "Agotado hoy", !!p?.agotado, { type: "checkbox" })}${fld("activo", "Visible en la app", p ? p.activo !== false : true, { type: "checkbox" })}
    <div class="full"><span class="lbl">Opciones que elige el cliente (tamaño, término, acompañamiento…)</span><div id="grps"></div>
      <div class="acts-g"><button type="button" class="btn btn-light btn-sm" id="gAdd">${ico("plus")} Nuevo grupo</button>${Object.keys(plant).length ? `<select class="q" id="gPl"><option value="">+ Copiar un grupo que ya usas…</option>${Object.entries(plant).map(([k, g]) => `<option value="${esc(k)}">${esc(g.titulo)}</option>`).join("")}</select>` : ""}</div></div></div>
    ${p ? `<button type="button" class="btn btn-light danger btn-sm" id="delP">${ico("trash")} Eliminar plato</button>` : ""}`, async d => {
    leerG(); if (G.find(g => !g.titulo || !g.items.length)) { toast("Cada grupo necesita título y al menos una opción", true); return false; }
    const id = p?.id || "p" + Date.now().toString(36), foto = await subirFoto(`negocios/${NEG.id}/productos/${id}-${Date.now().toString(36)}.jpg`, FOTO);
    await DB.set(`negocios/${NEG.id}/productos`, id, { nombre: d.nombre, cat: d.cat, precio: r2(d.precio), desc: d.desc, destacado: d.destacado, sugerirBebida: d.sugerirBebida, extrasGratis: !!d.extrasGratis, agotado: d.agotado, activo: d.activo, foto, opciones: G, orden: p?.orden ?? PRODS.length, actualizado: new Date().toISOString() }, false);
    toast("Plato guardado · ya se ve en la app"); VIEWS.carta(); }, "Guardar", { wide: true, alAbrir: F => {
    const pintarG = () => { $("#grps").innerHTML = G.map((g, k) => `<div class="grp" data-g="${k}"><div class="grp-h"><input class="q" data-gt value="${esc(g.titulo)}" placeholder="Título (ej. Tamaño)" aria-label="Título del grupo"><select class="q" data-gk><option value="uno" ${g.tipo !== "varios" ? "selected" : ""}>Elige 1</option><option value="varios" ${g.tipo === "varios" ? "selected" : ""}>Elige varios</option></select>
      <label class="chk"><input type="checkbox" data-gr ${g.req ? "checked" : ""}><span>Obligatorio</span></label><button type="button" class="btn btn-light btn-xs" data-gx="${k}" aria-label="Quitar grupo">${ico("trash")}</button></div>
      <textarea class="q" data-gi rows="${Math.max(3, (g.items || []).length)}" placeholder="Una opción por línea. Si cuesta más: Nombre | 3">${esc(gruposTxt(g))}</textarea></div>`).join("") || `<p class="muted sm">Sin opciones: el cliente lo agrega directo.</p>`; };
    leerG = () => $$(".grp", F).forEach(el => { const g = G[+el.dataset.g]; g.titulo = $("[data-gt]", el).value.trim(); g.tipo = $("[data-gk]", el).value; g.req = $("[data-gr]", el).checked;
      g.items = $("[data-gi]", el).value.split("\n").map(l => { const [n, pr] = l.split("|").map(x => (x || "").trim()); return n ? { n, ...(+pr ? { p: r2(pr) } : {}) } : null; }).filter(Boolean); });
    pintarG();
    $("#gAdd").onclick = () => { leerG(); G.push({ titulo: "", tipo: "uno", req: true, items: [] }); pintarG(); };
    $("#gPl")?.addEventListener("change", e => { const g = plant[e.target.value]; if (!g) return; leerG(); G.push(JSON.parse(JSON.stringify(g))); e.target.value = ""; pintarG(); });
    $("#grps").onclick = e => { const x = e.target.closest("[data-gx]"); if (x) { leerG(); G.splice(+x.dataset.gx, 1); pintarG(); } };
    $("#fFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; FOTO = await redimensionar(f, 800, .74); $("#fPrev").style.backgroundImage = `url('${FOTO}')`; };
    $("#fX").onclick = () => { FOTO = ""; $("#fPrev").style.backgroundImage = "none"; };
    $("#delP")?.addEventListener("click", async () => { if (!confirm(`¿Eliminar «${p.nombre}»?`)) return; await DB.del(`negocios/${NEG.id}/productos`, p.id); cerrarModal(); toast("Plato eliminado"); VIEWS.carta(); }); } });
}

/* ================= NEGOCIO · CAJA ================= */
let CAJA_F = null;
VIEWS.caja = async () => {
  CAJA_F = CAJA_F || HOY(); const col = `negocios/${NEG.id}/movimientos`, l = (await DB.list(col, ["fecha", "==", CAJA_F])).sort((a, b) => String(a.hora).localeCompare(String(b.hora)));
  const ing = l.filter(m => m.monto > 0).reduce((a, m) => a + m.monto, 0), egr = l.filter(m => m.monto < 0).reduce((a, m) => a + m.monto, 0), por = {}; l.forEach(m => por[m.metodo] = (por[m.metodo] || 0) + m.monto);
  $("#view").innerHTML = topBar("Caja", "Lo que cobraste por la app, más tus gastos.", `<input type="date" id="cf" value="${CAJA_F}" class="q"><button class="btn btn-light btn-sm" id="mov">${ico("plus")} Gasto / ingreso</button>`) + `
    <div class="kpis neon"><div class="kpi"><span>Saldo del día</span><b>${S(ing + egr)}</b><small>${l.length} movimiento(s)</small></div><div class="kpi"><span>Ingresos</span><b>${S(ing)}</b></div><div class="kpi"><span>Gastos</span><b>${S(egr)}</b></div>${METODOS.map(k => `<div class="kpi"><span>${k}</span><b>${S(por[k] || 0)}</b></div>`).join("")}</div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Hora</th><th>Concepto</th><th>Método</th><th class="r">Monto</th></tr></thead><tbody>
    ${l.map(m => `<tr><td>${fmtH(m.hora)}</td><td>${esc(m.concepto)}</td><td>${esc(m.metodo)}</td><td class="r ${m.monto < 0 ? "neg" : ""}">${S(m.monto)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sin movimientos este día.</td></tr>`}</tbody></table></div></section>`;
  $("#cf").onchange = e => { CAJA_F = e.target.value; VIEWS.caja(); };
  $("#mov").onclick = () => modal("Gasto o ingreso", `<div class="g2">${fld("tipo", "Tipo", "egreso", { opts: [["egreso", "Gasto / compra"], ["ingreso", "Ingreso"]] })}${fld("monto", "Monto (S/)", "", { type: "number", req: true, extra: 'min="0.1" step="0.1"' })}${fld("concepto", "Concepto", "", { req: true, full: true })}${fld("metodo", "Método", "Efectivo", { opts: METODOS })}</div>`,
    async d => { await DB.batch([movimiento({ concepto: d.concepto, monto: d.tipo === "egreso" ? -d.monto : d.monto, metodo: d.metodo, fecha: CAJA_F })]); toast("Registrado"); VIEWS.caja(); });
};

/* ================= NEGOCIO · COMISIÓN ================= */
VIEWS.comision = async () => {
  const mes = HOY().slice(0, 7), l = (await DB.list("pedidos", ["negocioId", "==", NEG.id], ["mes", "==", mes])).filter(p => p.estado === "entregado"), pct = pctDe(NEG), v = l.reduce((a, p) => a + (+(p.montoFinal ?? p.subtotal) || 0), 0);
  $("#view").innerHTML = topBar("Comisión Apamuy", `Apamuy cobra el ${pct}% de la comida de cada pedido entregado por la app.`) + `
    <div class="kpis neon"><div class="kpi"><span>Ventas por la app (mes)</span><b>${S(v)}</b><small>${l.length} pedido(s) entregado(s)</small></div><div class="kpi"><span>Comisión del mes</span><b>${S(v * pct / 100)}</b><small>${pct}%</small></div></div>
    <section class="card"><p>📅 Cada semana te enviaremos tu liquidación para pagar por Yape. Muy pronto la verás aquí con el botón para subir tu pago.</p></section>`;
};
VIEWS.negocio = async () => { $("#view").innerHTML = topBar("Mi negocio", "Estos datos se ven en la app. " + estN(NEG.estado)) + `<div id="negF"></div>`; formNegocio($("#negF"), NEG); };

/* ================= ADMIN · avisos ================= */
function vigilarAdm() {
  const cnt = k => l => { const b = $("#cnt-" + k); if (b) { b.textContent = l.length; b.hidden = !l.length; } };
  DB.escucharLista("negocios", [["estado", "==", "pendiente"]], cnt("negocios")); DB.escucharLista("repartidores", [["estado", "==", "pendiente"]], cnt("repartidores")); DB.escucharLista("pagosRep", [["estado", "==", "pendiente"]], cnt("cobrosRep"));
}

/* ================= ADMIN · RESUMEN ================= */
VIEWS.resumen = async () => {
  const [ns, hoy, mes, rs] = await Promise.all([DB.list("negocios"), DB.list("pedidos", ["dia", "==", HOY()]), DB.list("pedidos", ["mes", "==", HOY().slice(0, 7)]), DB.list("repartidores").catch(() => [])]);
  const ent = l => l.filter(p => p.estado === "entregado"), com = l => ent(l).reduce((a, p) => a + (+(p.montoFinal ?? p.subtotal) || 0) * pctDe(ns.find(n => n.id === p.negocioId)) / 100, 0);
  const pend = ns.filter(n => n.estado === "pendiente");
  $("#view").innerHTML = topBar("Resumen de Apamuy", "Todo lo que pasa en la plataforma.") + `
    <div class="kpis neon"><div class="kpi"><span>Negocios activos</span><b>${ns.filter(n => n.estado === "activo").length}</b><small>${pend.length} por revisar</small></div><div class="kpi"><span>Pedidos de hoy</span><b>${hoy.length}</b><small>${ent(hoy).length} entregados</small></div>
      <div class="kpi"><span>Ventas de hoy</span><b>${S(ent(hoy).reduce((a, p) => a + (+(p.montoFinal ?? p.subtotal) || 0), 0))}</b><small>comida entregada</small></div><div class="kpi"><span>Tu comisión hoy</span><b>${S(com(hoy))}</b></div><div class="kpi"><span>Tu comisión del mes</span><b>${S(com(mes))}</b><small>${ent(mes).length} pedidos</small></div>
      <div class="kpi"><span>Repartidores</span><b>${rs.filter(r => r.estado === "activo").length}</b><small>${rs.filter(r => r.estado === "activo" && r.disponible).length} disponibles ahora · ${rs.filter(r => r.estado === "pendiente").length} por revisar</small></div></div>
    <section class="card"><div class="card-h"><h2>${ico("clock")} Negocios por revisar</h2><button class="btn btn-light btn-sm" data-go="negocios">Ver todos</button></div>
      <ul class="lst">${pend.map(n => `<li><div><b>${esc(n.nombre)}</b><small>${esc(n.tipo)} · ${esc(n.email || "")} · ${hace(n.creado)}</small></div><button class="btn btn-pri btn-sm" data-rev="${esc(n.id)}">Revisar</button></li>`).join("") || `<li class="muted">No hay negocios esperando. 👍</li>`}</ul></section>`;
  $("#view").onclick = e => { const b = e.target.closest("[data-rev]"); if (b) verNegocio(ns.find(n => n.id === b.dataset.rev)); };
};

/* ================= ADMIN · NEGOCIOS ================= */
let NF = "";
VIEWS.negocios = async () => {
  const ns = (await DB.list("negocios")).sort((a, b) => String(b.creado).localeCompare(a.creado)), l = ns.filter(n => !NF || n.estado === NF);
  $("#view").innerHTML = topBar("Negocios", "Aprueba, suspende y revisa cada negocio. Su carta solo la edita su dueño.") + `<div class="chips">${[["", "Todos"], ["pendiente", "En revisión"], ["activo", "Activos"], ["suspendido", "Suspendidos"], ["rechazado", "Rechazados"]].map(([k, t]) => `<button class="chip ${NF === k ? "on" : ""}" data-nf="${k}">${t} (${k ? ns.filter(n => n.estado === k).length : ns.length})</button>`).join("")}</div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th></th><th>Negocio</th><th>Dueño</th><th>Estado</th><th>Comisión</th><th></th></tr></thead><tbody>
    ${l.map(n => `<tr><td>${n.logo ? `<span class="p-th" style="background-image:url('${esc(n.logo)}')"></span>` : `<span class="p-th em">🏪</span>`}</td><td><b>${esc(n.nombre)}</b>${n.demo ? ` <span class="st mute">Ejemplo</span>` : ""}<small>${esc(rubroDe(n.rubro).nombre)} · ${esc(n.tipo || "")} · ${esc(n.distrito || "")}, ${esc(n.provincia || "")}</small></td><td>${esc(n.email || "")}<small>${esc(n.telefono || "")}</small></td><td>${estN(n.estado)}</td><td>${pctDe(n)}%</td>
      <td><button class="btn btn-light btn-sm" data-vn="${esc(n.id)}">Ver</button></td></tr>`).join("") || `<tr><td colspan="6" class="muted">Sin negocios.</td></tr>`}</tbody></table></div></section>`;
  $("#view").onclick = e => { const f = e.target.closest("[data-nf]"); if (f) { NF = f.dataset.nf; return VIEWS.negocios(); } const v = e.target.closest("[data-vn]"); if (v) verNegocio(ns.find(n => n.id === v.dataset.vn)); };
};
async function verNegocio(n) {
  const [cats, prods] = await Promise.all([DB.list(`negocios/${n.id}/categorias`), DB.list(`negocios/${n.id}/productos`)]), doc = n.documento || {};
  modal(n.nombre, `<div class="nv">${n.portada ? `<img class="nv-p" src="${esc(n.portada)}" alt="">` : ""}<div class="nv-h">${n.logo ? `<img src="${esc(n.logo)}" alt="">` : ""}<div><b>${esc(n.nombre)}</b> ${estN(n.estado)}<small>${esc(n.tipo || "")} · registrado ${fmtF(n.creado)}</small></div></div>
    <dl class="dl"><dt>Dueño</dt><dd>${esc(n.email || "")}</dd><dt>Celular</dt><dd>${esc(n.telefono || "")} ${n.whatsapp ? `· <a href="${wa(n.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</dd>
      <dt>Rubro</dt><dd>${esc(rubroDe(n.rubro).nombre)} · ${esc(n.tipo || "")}${n.registro ? ` · ${esc(rubroDe(n.rubro).requiereRegistro || "Registro")}: <b>${esc(n.registro)}</b>` : ""}</dd><dt>Ciudad</dt><dd>${esc(n.distrito || "")}, ${esc(n.provincia || "")} (${esc(n.departamento || "")})</dd><dt>${esc(doc.tipo || "Doc.")}</dt><dd>${esc(doc.numero || "")} · ${esc(doc.nombre || "")}</dd><dt>Dirección</dt><dd>${esc(n.direccion || "")}${n.referencia ? " · " + esc(n.referencia) : ""}${n.ubic ? ` · <a href="https://maps.google.com/?q=${n.ubic.lat},${n.ubic.lng}" target="_blank" rel="noopener">Ver en mapa</a>` : ""}</dd>
      <dt>Horario</dt><dd>${esc(n.abre)} a ${esc(n.cierra)} · ${(n.dias || []).map(i => DIAS[i]).join(", ")}</dd><dt>Pagos</dt><dd>${[n.pagoYape && "Yape " + esc(n.yapeNum || ""), n.pagoPlin && "Plin " + esc(n.plinNum || ""), n.contraEntrega && "Efectivo"].filter(Boolean).join(" · ")}</dd>
      <dt>Carta</dt><dd>${cats.length} categoría(s) · ${prods.length} plato(s)${prods.length ? ": " + esc(prods.slice(0, 6).map(p => p.nombre).join(", ")) + (prods.length > 6 ? "…" : "") : ""}</dd>${n.motivo ? `<dt>Nota</dt><dd>${esc(n.motivo)}</dd>` : ""}</dl>
    <div class="g2">${fld("estado", "Estado", n.estado, { opts: [["pendiente", "En revisión"], ["activo", "Activo (aparece en la app)"], ["suspendido", "Suspendido"], ["rechazado", "Rechazado"]] })}${fld("comision", "Comisión % (vacío = general " + CONF.comision + "%)", n.comision ?? "", { type: "number", extra: 'min="0" max="50" step="0.5"' })}
      ${fld("motivo", "Motivo (lo ve el negocio si lo suspendes o rechazas)", n.motivo || "", { full: true })}</div>
    <p class="muted sm">${ico("lock")} Como admin no puedes editar sus platos ni sus datos: solo el dueño.</p></div>`, async d => {
    if (["suspendido", "rechazado"].includes(d.estado) && !d.motivo) { toast("Escribe el motivo", true); return false; }
    await DB.set("negocios", n.id, { estado: d.estado, comision: d.comision === "" ? null : +d.comision, motivo: d.estado === "activo" ? "" : d.motivo, revisado: new Date().toISOString(), ...(d.estado === "activo" && !n.aprobado ? { aprobado: new Date().toISOString() } : {}) });
    toast(d.estado === "activo" ? "✅ Negocio activo: ya aparece en la app" : "Guardado"); if (VISTA) go(VISTA); }, "Guardar", { wide: true });
}

/* ================= ADMIN · PEDIDOS ================= */
let PA_D = null;
VIEWS.pedidosAdm = async () => {
  PA_D = PA_D || HOY(); const [l, ns] = await Promise.all([DB.list("pedidos", ["dia", "==", PA_D]), DB.list("negocios")]); l.sort((a, b) => String(b.creado).localeCompare(a.creado));
  $("#view").innerHTML = topBar("Pedidos de toda la plataforma", "Solo lectura: cada negocio atiende los suyos.", `<input type="date" class="q" id="pd" value="${PA_D}">`) + `
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Hora</th><th>Código</th><th>Negocio</th><th>Cliente</th><th>Entrega</th><th>Repartidor</th><th>Pago</th><th class="r">Comida</th><th>Estado</th></tr></thead><tbody>
    ${l.map(p => `<tr><td>${fmtH(p.creado)}</td><td class="mono">${esc(p.codigo)}</td><td>${esc(p.negocio.nombre)}</td><td>${esc(p.cliente.nombre)}<small>${esc(p.cliente.celular)}</small></td><td>${p.entrega === "delivery" ? `🛵 ${p.km} km` : "🏪"}</td><td>${p.repartidor ? `${vehTxt(p.repartidor.vehiculo).split(" ")[0]} ${esc(p.repartidor.nombre)}` : p.oferta && p.estado !== "entregado" ? `<span class="st warn">Buscando</span>` : "—"}</td><td>${esc(p.pago)}</td><td class="r">${S(p.subtotal)}</td><td>${estP(p.estado, p)}${String(p.negocioId).startsWith("demo-") && !["entregado", "anulado", "rechazado"].includes(p.estado) ? ` <button class="btn btn-light btn-xs" data-at="${esc(p.id)}">Atender</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="9" class="muted">Sin pedidos ese día.</td></tr>`}</tbody></table></div>
    <p class="muted sm">Los pedidos a <b>tiendas de ejemplo</b> los puedes avanzar tú con «Atender» para probar el seguimiento del cliente.</p></section>`;
  $("#view").onclick = e => { const b = e.target.closest("[data-at]"); if (!b) return; const p = l.find(x => x.id === b.dataset.at);
    modal(`Tienda de ejemplo · ${p.codigo}`, fld("estado", "Nuevo estado", p.estado, { opts: [["nuevo", "Recibido"], ["cocina", "Preparando"], ["listo", "Listo"], ["camino", "En camino"], ["entregado", "Entregado"], ["anulado", "Anulado"]] }),
      async d => { const n = ns.find(x => x.id === p.negocioId) || {};
        const extra = d.estado === "cocina" && p.entrega === "delivery" && !p.oferta ? opOferta(p, "todos", 25, n) : ["entregado", "anulado"].includes(d.estado) ? cerrarOferta(p) : [];
        await DB.batch([{ op: "set", col: "pedidos", id: p.id, data: { estado: d.estado, ...(d.estado === "cocina" ? { tiempo: 25 } : {}), actualizado: new Date().toISOString() } }, ...extra]); toast(extra.length > 1 ? "Estado cambiado · avisamos a los repartidores" : "Estado cambiado"); VIEWS.pedidosAdm(); }, "Guardar"); };
  $("#pd").onchange = e => { PA_D = e.target.value; VIEWS.pedidosAdm(); };
};

/* ================= ADMIN · COMISIONES ================= */
let CM_M = null;
VIEWS.comisiones = async () => {
  CM_M = CM_M || HOY().slice(0, 7); const [l, ns] = await Promise.all([DB.list("pedidos", ["mes", "==", CM_M]), DB.list("negocios")]), R = {};
  l.filter(p => p.estado === "entregado").forEach(p => { const r = R[p.negocioId] || (R[p.negocioId] = { cnt: 0, v: 0 }); r.cnt++; r.v += +p.subtotal || 0; });
  const filas = Object.entries(R).map(([id, r]) => { const n = ns.find(x => x.id === id) || { id, nombre: id }; return { n, ...r, pct: pctDe(n), c: r.v * pctDe(n) / 100 }; }).sort((a, b) => b.c - a.c);
  $("#view").innerHTML = topBar("Comisiones", "Lo que cada negocio te debe por los pedidos entregados.", `<input type="month" class="q" id="cm" value="${CM_M}">`) + `
    <div class="kpis neon"><div class="kpi"><span>Comisión del mes</span><b>${S(filas.reduce((a, f) => a + f.c, 0))}</b></div><div class="kpi"><span>Ventas de comida</span><b>${S(filas.reduce((a, f) => a + f.v, 0))}</b></div><div class="kpi"><span>Pedidos entregados</span><b>${filas.reduce((a, f) => a + f.cnt, 0)}</b></div></div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Negocio</th><th>Pedidos</th><th class="r">Ventas</th><th>%</th><th class="r">Comisión</th><th></th></tr></thead><tbody>
    ${filas.map(f => `<tr><td><b>${esc(f.n.nombre)}</b></td><td>${f.cnt}</td><td class="r">${S(f.v)}</td><td>${f.pct}%</td><td class="r"><b>${S(f.c)}</b></td><td>${f.n.whatsapp ? `<button class="btn btn-wa btn-sm" data-cob="${esc(f.n.id)}">${ico("wa")} Cobrar</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Sin pedidos entregados ese mes.</td></tr>`}</tbody></table></div>
    <p class="muted sm">En la etapa 3 esto se hace solo cada semana: liquidación, pago por Yape con captura y suspensión automática si no paga.</p></section>`;
  $("#cm").onchange = e => { CM_M = e.target.value; VIEWS.comisiones(); };
  $("#view").onclick = e => { const b = e.target.closest("[data-cob]"); if (!b) return; const f = filas.find(x => x.n.id === b.dataset.cob);
    abrirWA(f.n.whatsapp, `Hola ${f.n.nombre} 👋 te escribe Apamuy.\n\nEn ${CM_M} vendiste ${S(f.v)} en comida por la app (${f.cnt} pedidos). La comisión del ${f.pct}% es *${S(f.c)}*.\n\n¡Gracias por vender con Apamuy!`); };
};

/* ================= ADMIN · CLIENTES ================= */
VIEWS.clientes = async () => {
  const l = (await DB.list("usuarios")).sort((a, b) => String(b.creado).localeCompare(a.creado));
  $("#view").innerHTML = topBar("Clientes", `${l.length} cliente(s) registrados con Google.`) + `<section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Nombre</th><th>Correo</th><th>Celular</th><th>Direcciones</th><th>Desde</th></tr></thead><tbody>
    ${l.slice(0, 500).map(u => `<tr><td><b>${esc(u.nombre || "")}</b></td><td>${esc(u.email || "")}</td><td>${esc(u.celular || "")}</td><td>${(u.direcciones || []).length}</td><td>${fmtF(u.creado)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Aún no hay clientes.</td></tr>`}</tbody></table></div></section>`;
};

/* ================= ADMIN · CONFIGURACIÓN ================= */
VIEWS.config = async () => {
  await cargarConfig(); const c = CONF, d = c.delivery; let pos = c.centro;
  $("#view").innerHTML = topBar("Configuración de Apamuy", "Se aplica a toda la plataforma.") + `<form class="card" id="cF">
    <h2>${ico("percent")} Comisión</h2><div class="g2">${fld("comision", "Comisión general (% de la comida)", c.comision, { type: "number", extra: 'min="0" max="50" step="0.5"', help: "A cada negocio le puedes poner otro % en «Negocios»." })}</div>
    <h2>${ico("bike")} Costo del delivery (lo cobra el repartidor)</h2><p class="muted sm">Tarifa general. Para una provincia con otros precios, usa «Tarifas por provincia» (abajo).</p><div class="g2">${fld("base", "Tarifa base (primer km) S/", d.base, { type: "number", extra: 'min="0" step="0.5"' })}${fld("porKm", "Por cada km adicional S/", d.porKm, { type: "number", extra: 'min="0" step="0.1"' })}${fld("maxKm", "Distancia máxima · comida y tiendas (km)", d.maxKm, { type: "number", extra: 'min="1" step="0.5"' })}${fld("maxKmGrande", "Distancia máxima · ferreterías y talleres (km)", d.maxKmGrande ?? 50, { type: "number", extra: 'min="1" step="1"', help: "Rubros con «envío grande». Cada negocio puede poner un radio menor." })}
      <div class="fld"><span>Ejemplo</span><b id="ej"></b></div></div>
    <h2>${ico("pin")} Ciudad</h2><p class="muted sm">Punto donde empiezan los mapas.</p><div class="mapa" id="cMapa"></div>
    <h2>${ico("store")} Tipos de negocio</h2>${fld("tipos", "Uno por línea", c.tipos.join("\n"), { type: "textarea", full: true, rows: 6 })}
    <h2>${ico("bike")} Repartidores</h2><div class="g2">${fld("repCom", "Lo que paga el repartidor (% de su ganancia del día)", c.rep.comision, { type: "number", extra: 'min="0" max="50" step="0.5"' })}${fld("casaca", "Precio de la casaca (S/)", c.rep.casaca, { type: "number", extra: 'min="0" step="1"', help: "La inscripción es gratis: solo pagan la casaca." })}</div>
    <h2>${ico("box")} Envíos de paquetes</h2><p class="muted sm">El cliente pone su precio. Aquí defines el mínimo y el precio sugerido que le mostramos como guía.</p><div class="g2">
      ${fld("eMin", "Precio mínimo (S/)", c.envio.minimo, { type: "number", extra: 'min="1" step="0.5"' })}${fld("eBase", "Sugerido: base primer km (S/)", c.envio.base, { type: "number", extra: 'min="0" step="0.5"' })}
      ${fld("ePorKm", "Sugerido: por km adicional (S/)", c.envio.porKm, { type: "number", extra: 'min="0" step="0.1"' })}${fld("eGrande", "Paquete grande: multiplicar por", c.envio.factorGrande, { type: "number", extra: 'min="1" step="0.1"' })}
      ${fld("eMax", "Distancia máxima (km)", c.envio.maxKm, { type: "number", extra: 'min="1" step="1"' })}<div class="fld"><span>Ejemplo sugerido</span><b id="ejE"></b></div></div>
    <h2>${ico("qr")} Tu Yape (aquí te pagan repartidores)</h2><div class="g2">${fld("cYape", "Número de Yape", c.cobro.yape || "")}${fld("cTit", "A nombre de", c.cobro.titular || "")}
      <div class="fld full"><span>QR de Yape</span><div class="foto-up"><span class="fp-yapeQR" id="cQrV" style="background-image:url('${esc(imgUrl(c.cobro.qr))}')"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir QR<input type="file" accept="image/*" id="cQr" hidden></label></div></div></div>
    <h2>${ico("bell")} Avisos al celular (notificaciones)</h2>${fld("vapid", "Clave pública de notificaciones (VAPID)", c.vapid || "", { full: true, ph: "Empieza con B… (Firebase → Configuración del proyecto → Cloud Messaging → Certificados web push)", help: "Es pública: no es una contraseña. Sin ella no se pueden activar los avisos." })}
    <h2>${ico("wa")} Soporte</h2>${fld("soporte", "WhatsApp de soporte de Apamuy", c.soporte || "")}
    <div class="f-end"><button class="btn btn-pri">${ico("check")} Guardar</button></div></form>
    <section class="card" id="tarifas"></section>`;
  pintarTarifas();
  const F = $("#cF"), ej = () => { const x = { base: +F.base.value || 0, porKm: +F.porKm.value || 0, maxKm: +F.maxKm.value || 1 }; $("#ej").textContent = `1 km: ${S(costoDelivery(1, x))} · 3 km: ${S(costoDelivery(3, x))} · 5 km: ${S(costoDelivery(5, x))}`;
    const y = { minimo: +F.eMin.value || 0, base: +F.eBase.value || 0, porKm: +F.ePorKm.value || 0, factorGrande: +F.eGrande.value || 1 }; $("#ejE").textContent = `3 km: ${S(sugerirEnvio(3, "pequeno", y))} · 10 km: ${S(sugerirEnvio(10, "pequeno", y))} · 50 km: ${S(sugerirEnvio(50, "pequeno", y))}`; };
  F.oninput = ej; ej(); mapaPin($("#cMapa"), pos, q => pos = q); let QR = c.cobro.qr || "";
  $("#cQr").onchange = async e => { const f = e.target.files[0]; if (!f) return; QR = await redimensionar(f, 600, .9, "image/png"); $("#cQrV").style.backgroundImage = `url('${QR}')`; };
  F.onsubmit = async e => { e.preventDefault(); const v = datosForm(F);
    await DB.set("config", "general", { comision: +v.comision || 0, delivery: { base: +v.base || 0, porKm: +v.porKm || 0, maxKm: +v.maxKm || 15, maxKmGrande: +v.maxKmGrande || 50 }, centro: pos, tipos: v.tipos.split("\n").map(x => x.trim()).filter(Boolean), soporte: v.soporte.replace(/\D/g, ""), vapid: (v.vapid || "").trim(),
      rep: { comision: +v.repCom || 0, casaca: +v.casaca || 0 }, envio: { minimo: +v.eMin || 5, base: +v.eBase || 0, porKm: +v.ePorKm || 0, factorGrande: +v.eGrande || 1, maxKm: +v.eMax || 300 }, cobro: { yape: v.cYape, titular: v.cTit, qr: await subirFoto(`web/cobro/yape-${Date.now().toString(36)}.png`, QR) } });
    await cargarConfig(); toast("Configuración guardada"); };
};

/* ---------- Tarifas por provincia (delivery y envíos). Las que no tienen, usan la general. ---------- */
function pintarTarifas() {
  const box = $("#tarifas"); if (!box) return; const L = (CONF.tarifas || []).slice().sort((a, b) => a.prov.localeCompare(b.prov)), g = CONF.delivery, ge = CONF.envio;
  const v = (x, def) => x === "" || x == null ? `<span class="muted">${S(def)}</span>` : S(x);
  box.innerHTML = `<div class="v-h sm"><div><h2>${ico("pin")} Tarifas por provincia</h2><p class="muted sm">Ej. en una provincia de la selva el km cuesta más. Lo que dejes vacío usa la tarifa general (en gris).</p></div><button class="btn btn-pri btn-sm" id="tfAdd">${ico("plus")} Agregar provincia</button></div>
    ${L.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Provincia</th><th>Delivery base</th><th>Por km</th><th>Envío mínimo</th><th>Envío base</th><th>Envío por km</th><th>Ejemplo 5 km</th><th></th></tr></thead><tbody>
    ${L.map((t, i) => { const T = tarifaProv(t.prov); return `<tr><td><b>${esc(t.prov.split("|")[1])}</b><small class="muted"> · ${esc(t.prov.split("|")[0])}</small></td><td>${v(t.base, g.base)}</td><td>${v(t.porKm, g.porKm)}</td><td>${v(t.eMin, ge.minimo)}</td><td>${v(t.eBase, ge.base)}</td><td>${v(t.ePorKm, ge.porKm)}</td>
      <td class="nw">🛵 ${S(costoDelivery(5, { ...T.delivery, maxKm: 999 }))} · 📦 ${S(sugerirEnvio(5, "pequeno", T.envio))}</td><td class="nw"><button class="btn btn-light btn-sm" data-tf="${esc(t.prov)}">Editar</button> <button class="btn btn-light btn-sm danger" data-tfx="${esc(t.prov)}">Quitar</button></td></tr>`; }).join("")}</tbody></table></div>`
    : `<p class="muted">Aún no hay tarifas por provincia: todas usan la general (🛵 5 km = ${S(costoDelivery(5, { ...g, maxKm: 999 }))}).</p>`}`;
  $("#tfAdd").onclick = () => editarTarifa(null);
  box.onclick = async e => { const b = e.target.closest("[data-tf]"), x = e.target.closest("[data-tfx]");
    if (b) editarTarifa((CONF.tarifas || []).find(t => t.prov === b.dataset.tf));
    if (x && confirm("¿Quitar la tarifa de " + x.dataset.tfx.split("|")[1] + "? Volverá a usar la general.")) await guardarTarifas((CONF.tarifas || []).filter(t => t.prov !== x.dataset.tfx), "Tarifa quitada"); };
}
async function guardarTarifas(L, msg) { await DB.set("config", "general", { tarifas: L }); await cargarConfig(); toast(msg); pintarTarifas(); }
function editarTarifa(t) {
  const U = window.UBIGEO || {}, [d0, p0] = t ? t.prov.split("|") : [CONF.ciudadInicial.dep, CONF.ciudadInicial.prov], g = CONF.delivery, ge = CONF.envio;
  const num = (k, lab, def, step) => fld(k, lab, t && t[k] != null ? t[k] : "", { type: "number", extra: `min="0" step="${step}"`, ph: "General: " + def });
  modal(t ? "Tarifa de " + p0 : "Tarifa de una provincia", `<div class="g2"><label class="fld"><span>Departamento</span><select name="dep" id="tfDep" ${t ? "disabled" : ""}>${Object.keys(U).sort().map(x => `<option ${x === d0 ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
    <label class="fld"><span>Provincia</span><select name="prov" id="tfProv" ${t ? "disabled" : ""}></select></label></div>
    <h3 class="m-h">🛵 Delivery de pedidos</h3><div class="g2">${num("base", "Tarifa base (primer km) S/", g.base, 0.5)}${num("porKm", "Por cada km adicional S/", g.porKm, 0.1)}</div>
    <h3 class="m-h">📦 Envíos de paquetes</h3><div class="g3">${num("eMin", "Precio mínimo S/", ge.minimo, 0.5)}${num("eBase", "Sugerido: base S/", ge.base, 0.5)}${num("ePorKm", "Sugerido: por km S/", ge.porKm, 0.1)}</div>
    <p class="muted sm" id="tfEj"></p>`, async (d) => {
      const prov = t ? t.prov : provKey($("#tfDep").value, $("#tfProv").value), n = x => x === "" || x == null ? null : Math.max(0, +x);
      const nueva = { prov, base: n(d.base), porKm: n(d.porKm), eMin: n(d.eMin), eBase: n(d.eBase), ePorKm: n(d.ePorKm) };
      if (["base", "porKm", "eMin", "eBase", "ePorKm"].every(k => nueva[k] == null)) { toast("Pon al menos un precio", true); return false; }
      await guardarTarifas([...(CONF.tarifas || []).filter(x => x.prov !== prov), nueva], "Tarifa de " + prov.split("|")[1] + " guardada");
    }, "Guardar tarifa", { alAbrir: F => {
      const pv = () => { const dd = $("#tfDep").value; $("#tfProv").innerHTML = Object.keys(U[dd] || {}).sort().map(p => `<option ${p === p0 ? "selected" : ""}>${esc(p)}</option>`).join(""); }; pv(); $("#tfDep").onchange = pv;
      const ej = () => { const v = k => F[k].value === "" ? null : +F[k].value, dl = { base: v("base") ?? g.base, porKm: v("porKm") ?? g.porKm, maxKm: 999 }, en = { ...ge, minimo: v("eMin") ?? ge.minimo, base: v("eBase") ?? ge.base, porKm: v("ePorKm") ?? ge.porKm };
        $("#tfEj").textContent = `Ejemplo · Delivery: 3 km ${S(costoDelivery(3, dl))} · 8 km ${S(costoDelivery(8, dl))} · 20 km ${S(costoDelivery(20, dl))}  ·  Envío 10 km: ${S(sugerirEnvio(10, "pequeno", en))}`; };
      F.oninput = ej; ej(); } });
}

/* ================= ADMIN · PÁGINA WEB (textos de la portada y ejemplos) ================= */
VIEWS.web = async () => {
  await cargarConfig(); const W = CONF.web, c = CONF.ciudadInicial, U = window.UBIGEO || {};
  $("#view").innerHTML = topBar("Página web de Apamuy", "Todo lo que ven los clientes en la portada. Se guarda y se ve al instante.", `<a class="btn btn-light btn-sm" href="${esc(AP.web)}" target="_blank" rel="noopener">${ico("arrow")} Ver la web</a>`) + `
    <section class="card hi"><h2>${ico("download")} Ejemplos</h2><p>Carga los rubros (Comida, Farmacia, Talleres…), 2 banners y <b>4 negocios de comida en Cusco</b> con sus platos y fotos. Los negocios salen con la etiqueta «Ejemplo» y los puedes borrar cuando quieras.</p>
      <div class="acts-g"><button class="btn btn-pri" id="ejCargar">Cargar ejemplos</button><button class="btn btn-light danger" id="ejBorrar">Borrar negocios de ejemplo</button></div></section>
    <form class="card" id="wF"><h2>${ico("star")} Portada</h2><div class="g2">
      ${fld("titulo", "Título grande", W.titulo, { full: true })}${fld("subtitulo", "Texto debajo del título", W.subtitulo, { full: true })}${fld("buscador", "Texto del buscador", W.buscador, { full: true })}
      ${fld("anuncio", "Barra de anuncio arriba (vacío = no se muestra)", W.anuncio, { full: true, ph: "Ej. 🎉 Delivery gratis este fin de semana en Cusco" })}</div>
      <h2>${ico("grid")} Secciones</h2><div class="g2">${fld("mostrarBanners", "Mostrar banners", W.mostrarBanners, { type: "checkbox" })}${fld("mostrarDestacados", "Mostrar productos recomendados", W.mostrarDestacados, { type: "checkbox" })}
      ${fld("tituloDestacados", "Título de recomendados", W.tituloDestacados)}${fld("tituloNegocios", "Título de la lista de negocios", W.tituloNegocios)}</div>
      <h2>${ico("pin")} Ciudad para visitantes nuevos</h2><div class="g2"><label class="fld"><span>Departamento</span><select name="dep" id="wDep">${Object.keys(U).sort().map(d => `<option ${d === c.dep ? "selected" : ""}>${esc(d)}</option>`).join("")}</select></label><label class="fld"><span>Provincia</span><select name="prov" id="wProv"></select></label></div>
      <h2>${ico("msg")} Pie de página y redes</h2><div class="g2">${fld("pie", "Frase del pie de página", W.pie, { full: true })}${fld("facebook", "Facebook", W.facebook, { type: "url" })}${fld("instagram", "Instagram", W.instagram, { type: "url" })}${fld("tiktok", "TikTok", W.tiktok, { type: "url" })}</div>
      <div class="f-end"><button class="btn btn-pri">${ico("check")} Guardar</button></div></form>`;
  const pv = () => { const d = $("#wDep").value; $("#wProv").innerHTML = Object.keys(U[d] || {}).sort().map(p => `<option ${p === c.prov ? "selected" : ""}>${esc(p)}</option>`).join(""); }; pv(); $("#wDep").onchange = pv;
  $("#wF").onsubmit = async e => { e.preventDefault(); const d = datosForm(e.currentTarget);
    await DB.set("config", "general", { web: { titulo: d.titulo, subtitulo: d.subtitulo, buscador: d.buscador, anuncio: d.anuncio, mostrarBanners: d.mostrarBanners, mostrarDestacados: d.mostrarDestacados, tituloDestacados: d.tituloDestacados, tituloNegocios: d.tituloNegocios,
      pie: d.pie, facebook: d.facebook, instagram: d.instagram, tiktok: d.tiktok }, ciudadInicial: { dep: d.dep, prov: d.prov } }); await cargarConfig(); toast("Portada guardada · ya se ve en la web"); };
  $("#ejCargar").onclick = async () => {
    if (!confirm("Se crearán los rubros, 2 banners y 4 negocios de ejemplo en Cusco. Los rubros y banners que ya tengas con el mismo nombre se actualizan. ¿Continuar?")) return;
    const s = window.AM_SEMILLA(), ops = [];
    Object.entries(s).forEach(([col, docs]) => Object.entries(docs).forEach(([id, data]) => ops.push({ op: "set", col, id, data })));
    $("#ejCargar").disabled = true; $("#ejCargar").textContent = "Cargando…";
    try { await DB.batch(ops); await cargarRubros(true); toast(`✅ Listo: ${Object.keys(s.negocios).length} negocios y ${Object.keys(s.rubros).length} rubros de ejemplo`); }
    catch (x) { toast("No se pudo: " + (x.code || x.message) + ". ¿Publicaste las reglas nuevas?", true); }
    $("#ejCargar").disabled = false; $("#ejCargar").textContent = "Cargar ejemplos";
  };
  $("#ejBorrar").onclick = async () => {
    const ns = (await DB.list("negocios")).filter(n => String(n.id).startsWith("demo-")); if (!ns.length) return toast("No hay negocios de ejemplo");
    if (!confirm(`¿Borrar ${ns.length} negocios de ejemplo con sus platos?`)) return; const ops = [];
    for (const n of ns) { for (const sub of ["productos", "categorias"]) (await DB.list(`negocios/${n.id}/${sub}`)).forEach(x => ops.push({ op: "del", col: `negocios/${n.id}/${sub}`, id: x.id })); ops.push({ op: "del", col: "negocios", id: n.id }); }
    await DB.batch(ops); toast("Negocios de ejemplo borrados");
  };
};

/* ================= ADMIN · RUBROS ================= */
VIEWS.rubros = async () => {
  await cargarRubros(true); const ns = await DB.list("negocios");
  $("#view").innerHTML = topBar("Rubros", "Las categorías grandes de Apamuy, con su imagen. Agrega las que quieras para que la plataforma crezca.", `<button class="btn btn-pri btn-sm" id="nR">${ico("plus")} Rubro</button>`) + `
    <section class="card"><div class="rb-grid">${RUBROS.map((r, i) => `<div class="rb-c ${r.activo === false ? "off" : ""}"><span class="rb-i" style="background:${esc(r.color || "#FFF1E6")}">${r.imagen ? `<img src="${esc(imgUrl(r.imagen))}" alt="">` : ""}</span>
      <div><b>${esc(r.nombre)}</b><small>${r.modo === "servicios" ? "🔧 Servicios" : "🛍️ Productos"}${r.mayorEdad ? " · 🔞 +18" : ""}${envioGrande(r.id) ? " · 🚗 envío grande" : ""}${r.requiereRegistro ? " · 📄 registro" : ""} · ${ns.filter(n => (n.rubro || "comida") === r.id).length} negocio(s)${r.activo === false ? " · oculto" : ""}</small></div>
      <div class="rb-a"><button class="btn btn-light btn-xs" data-up="${i}" ${i ? "" : "disabled"} aria-label="Subir">▲</button><button class="btn btn-light btn-xs" data-dn="${i}" ${i < RUBROS.length - 1 ? "" : "disabled"} aria-label="Bajar">▼</button><button class="btn btn-light btn-sm" data-er="${esc(r.id)}">${ico("edit")}</button></div></div>`).join("")
      || vacio("Aún no hay rubros. Ve a «Página web» → Cargar ejemplos, o crea el primero.")}</div></section>`;
  const form = r => { let IMG = r?.imagen || "";
    modal(r ? r.nombre : "Nuevo rubro", `<div class="g2"><div class="full"><span class="lbl">Imagen (cuadrada, PNG con fondo transparente queda mejor)</span><div class="foto-up"><span id="rPrev" style="background-image:url('${esc(imgUrl(IMG))}');background-size:contain;background-color:${esc(r?.color || "#FFF1E6")}"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir imagen<input type="file" accept="image/*" id="rFile" hidden></label></div></div>
      ${fld("nombre", "Nombre", r?.nombre || "", { req: true, ph: "Ej. Mascotas" })}${fld("color", "Color de fondo", r?.color || "#FFF1E6", { type: "color" })}
      ${fld("modo", "¿Qué ofrecen?", r?.modo || "productos", { opts: [["productos", "Productos (se piden y se entregan)"], ["servicios", "Servicios (el cliente solicita y el negocio lo llama)"]] })}
      ${fld("tipos", "Tipos de negocio (uno por línea)", (r?.tipos || []).join("\n"), { type: "textarea", rows: 4, full: true })}
      ${fld("mayorEdad", "Solo mayores de 18 (licor, cigarros…)", !!r?.mayorEdad, { type: "checkbox" })}${fld("envioGrande", "Envío grande: va en carro (si el pedido es pequeño, solo en moto)", r ? envioGrande(r.id) : false, { type: "checkbox" })}${fld("activo", "Visible en la web", r ? r.activo !== false : true, { type: "checkbox" })}
      ${fld("requiereRegistro", "Registro que debe dar el negocio (vacío = ninguno)", r?.requiereRegistro || "", { full: true, ph: "Ej. N° de registro DIGEMID" })}${fld("aviso", "Aviso para los clientes (vacío = ninguno)", r?.aviso || "", { full: true })}</div>`, async d => {
      const id = r?.id || slug(d.nombre) || "rubro-" + Date.now().toString(36); if (!r && RUBROS.find(x => x.id === id)) { toast("Ya existe un rubro con ese nombre", true); return false; }
      const imagen = await subirFoto(`web/rubros/${id}-${Date.now().toString(36)}.png`, IMG);
      await DB.set("rubros", id, { nombre: d.nombre, color: d.color, modo: d.modo, tipos: d.tipos.split("\n").map(x => x.trim()).filter(Boolean), mayorEdad: d.mayorEdad, envioGrande: d.envioGrande, activo: d.activo, requiereRegistro: d.requiereRegistro, aviso: d.aviso, imagen, orden: r?.orden ?? RUBROS.length });
      toast("Rubro guardado · ya se ve en la web"); VIEWS.rubros(); }, "Guardar", { wide: true, alAbrir: () => {
      $("#rFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; IMG = await redimensionar(f, 300, .9, "image/png"); $("#rPrev").style.backgroundImage = `url('${IMG}')`; }; } }); };
  $("#nR").onclick = () => form();
  $("#view").onclick = async e => { const ed = e.target.closest("[data-er]"), up = e.target.closest("[data-up]"), dn = e.target.closest("[data-dn]");
    if (ed) return form(RUBROS.find(r => r.id === ed.dataset.er));
    if (up || dn) { const i = +(up || dn).dataset[up ? "up" : "dn"], j = up ? i - 1 : i + 1, l = RUBROS.slice(); [l[i], l[j]] = [l[j], l[i]]; await DB.batch(l.map((r, k) => ({ op: "set", col: "rubros", id: r.id, data: { orden: k } }))); VIEWS.rubros(); } };
};

/* ================= ADMIN · BANNERS ================= */
VIEWS.banners = async () => {
  const l = (await DB.list("banners")).sort((a, b) => (a.orden ?? 9) - (b.orden ?? 9)), ns = (await DB.list("negocios")).filter(n => n.estado === "activo");
  const destino = b => b.enlace === "panel" ? "Registro de negocios" : String(b.enlace || "").startsWith("rubro:") ? "Rubro " + rubroDe(b.enlace.slice(6)).nombre : String(b.enlace || "").startsWith("negocio:") ? "Negocio " + ((ns.find(n => n.id === b.enlace.slice(8)) || {}).nombre || "") : b.enlace || "—";
  $("#view").innerHTML = topBar("Banners", "Las promociones grandes de la portada. Puedes mostrarlas en todas las ciudades o solo en una.", `<button class="btn btn-pri btn-sm" id="nB">${ico("plus")} Banner</button>`) + `
    <section class="card"><div class="bn-l">${l.map(b => `<div class="bn-c ${b.activo === false ? "off" : ""}" style="--bn:${esc(b.color || "#E63946")}"><div><b>${esc(b.titulo)}</b><p>${esc(b.texto || "")}</p><small>→ ${esc(destino(b))} · ${b.prov ? esc(b.prov.replace("|", " / ")) : "Todas las ciudades"}${b.activo === false ? " · oculto" : ""}</small></div>${b.imagen ? `<img src="${esc(imgUrl(b.imagen))}" alt="">` : ""}<button class="btn btn-light btn-sm" data-eb="${esc(b.id)}">${ico("edit")}</button></div>`).join("") || vacio("Sin banners.")}</div></section>`;
  const form = b => { let IMG = b?.imagen || ""; const U = window.UBIGEO || {}, provs = [["", "Todas las ciudades"], ...Object.entries(U).flatMap(([d, ps]) => Object.keys(ps).map(p => [provKey(d, p), `${p} (${d})`])).sort((x, y) => x[1].localeCompare(y[1]))];
    modal(b ? "Editar banner" : "Nuevo banner", `<div class="g2">${fld("titulo", "Título", b?.titulo || "", { req: true, full: true })}${fld("texto", "Texto", b?.texto || "", { full: true })}${fld("boton", "Texto del botón", b?.boton || "Ver más")}${fld("color", "Color", b?.color || "#E63946", { type: "color" })}
      ${fld("tipoE", "Al tocarlo lleva a", String(b?.enlace || "rubro:").split(":")[0] === "rubro" ? "rubro" : String(b?.enlace || "").startsWith("negocio:") ? "negocio" : b?.enlace === "panel" ? "panel" : b ? "url" : "rubro", { opts: [["rubro", "Un rubro"], ["negocio", "Un negocio"], ["panel", "Registro de negocios"], ["url", "Otra página (enlace)"]] })}
      ${fld("rubroE", "Rubro", String(b?.enlace || "").startsWith("rubro:") ? b.enlace.slice(6) : (RUBROS[0] || {}).id, { opts: RUBROS.map(r => [r.id, r.nombre]) })}${fld("negE", "Negocio", String(b?.enlace || "").startsWith("negocio:") ? b.enlace.slice(8) : "", { opts: ns.map(n => [n.id, `${n.nombre} · ${n.provincia || ""}`]) })}
      ${fld("urlE", "Enlace https://", /^https?:/.test(b?.enlace || "") ? b.enlace : "", { type: "url" })}${fld("prov", "Mostrar en", b?.prov || "", { opts: provs })}${fld("activo", "Visible", b ? b.activo !== false : true, { type: "checkbox" })}
      <div class="full"><span class="lbl">Imagen (opcional, se ve redonda a la derecha)</span><div class="foto-up"><span id="bPrev" style="background-image:url('${esc(imgUrl(IMG))}')"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir imagen<input type="file" accept="image/*" id="bFile" hidden></label><button type="button" class="btn btn-light btn-sm" id="bX">Quitar</button></div></div></div>
      ${b ? `<button type="button" class="btn btn-light danger btn-sm" id="bDel">${ico("trash")} Eliminar banner</button>` : ""}`, async d => {
      const enlace = d.tipoE === "rubro" ? "rubro:" + d.rubroE : d.tipoE === "negocio" ? "negocio:" + d.negE : d.tipoE === "panel" ? "panel" : d.urlE;
      const id = b?.id || "b" + Date.now().toString(36), imagen = await subirFoto(`web/banners/${id}-${Date.now().toString(36)}.jpg`, IMG);
      await DB.set("banners", id, { titulo: d.titulo, texto: d.texto, boton: d.boton, color: d.color, enlace, prov: d.prov, activo: d.activo, imagen, orden: b?.orden ?? l.length }); toast("Banner guardado"); VIEWS.banners(); }, "Guardar", { wide: true, alAbrir: F => {
      const vis = () => { const t = $("[name=tipoE]", F).value; $("[name=rubroE]", F).closest("label").hidden = t !== "rubro"; $("[name=negE]", F).closest("label").hidden = t !== "negocio"; $("[name=urlE]", F).closest("label").hidden = t !== "url"; };
      $("[name=tipoE]", F).onchange = vis; vis();
      $("#bFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; IMG = await redimensionar(f, 500, .8); $("#bPrev").style.backgroundImage = `url('${IMG}')`; };
      $("#bX").onclick = () => { IMG = ""; $("#bPrev").style.backgroundImage = "none"; };
      $("#bDel")?.addEventListener("click", async () => { if (!confirm("¿Eliminar este banner?")) return; await DB.del("banners", b.id); cerrarModal(); VIEWS.banners(); }); } }); };
  $("#nB").onclick = () => form();
  $("#view").onclick = e => { const x = e.target.closest("[data-eb]"); if (x) form(l.find(b => b.id === x.dataset.eb)); };
};

/* ================= ADMIN · REPARTIDORES ================= */
const ESTADOS_R = { pendiente: ["Por revisar", "warn"], activo: ["Activo", "ok"], suspendido: ["Suspendido", "bad"], rechazado: ["Por corregir", "bad"] };
const estR = e => { const [t, c] = ESTADOS_R[e] || [e, "mute"]; return `<span class="st ${c}">${t}</span>`; };
const soatAl = r => !r.soatVence ? "" : r.soatVence < HOY() ? `<span class="st bad">SOAT vencido</span>` : r.soatVence < addD(HOY(), 15) ? `<span class="st warn">SOAT vence ${fmtF(r.soatVence)}</span>` : "";
let RF = "pendiente";
VIEWS.repartidores = async () => {
  const [rs0, pubs] = await Promise.all([DB.list("repartidores"), DB.list("repPublico").catch(() => [])]), rs = rs0.sort((a, b) => String(b.creado).localeCompare(a.creado)), l = rs.filter(r => RF === "foto" ? r.fotoNueva : !RF || r.estado === RF);
  const pubDe = id => pubs.find(x => x.id === id);
  $("#view").innerHTML = topBar("Repartidores", "Revisa sus documentos, apruébalos o suspéndelos.", `<a class="btn btn-light btn-sm" href="${esc(AP.reparto || "https://reparto.apamuy.app")}" target="_blank" rel="noopener">${ico("arrow")} App de repartidores</a>`)
    + `<div class="chips">${[["pendiente", "Por revisar"], ["foto", "📸 Fotos nuevas"], ["activo", "Activos"], ["suspendido", "Suspendidos"], ["rechazado", "Por corregir"], ["", "Todos"]].map(([k, t]) => `<button class="chip ${RF === k ? "on" : ""}" data-rf="${k}">${t} (${k === "foto" ? rs.filter(r => r.fotoNueva).length : k ? rs.filter(r => r.estado === k).length : rs.length})</button>`).join("")}</div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Repartidor</th><th>Vehículo</th><th>Ciudad</th><th>Estado</th><th></th></tr></thead><tbody>
    ${l.map(r => `<tr><td><div class="rp-n">${r.fotoPerfil ? `<img src="${esc(r.fotoPerfil)}" alt="">` : `<span>${esc((r.nombre || "?")[0])}</span>`}<div><b>${esc(r.nombre)}</b>${r.fotoNueva ? ` <span class="st warn">📸 foto nueva</span>` : ""}<small>${estrellasTxt(promEstrellas(pubDe(r.id)), pubDe(r.id)?.estrellasN)} · ${pubDe(r.id)?.entregas || 0} entregas</small><small>DNI ${esc(r.dni)} · <a href="tel:${esc(r.celular)}">${esc(r.celular)}</a> · ${hace(r.creado)}</small></div></div></td><td>${vehTxt(r.vehiculo)}${r.marca || r.color ? `<small>${esc([r.marca, r.color].filter(Boolean).join(" · "))}</small>` : ""}${r.placa ? `<small>${esc(r.placa)}</small>` : ""}${soatAl(r)}</td>
      <td>${esc(r.provincia || "")}<small>${esc(r.departamento || "")}</small></td><td>${estR(r.estado)}${r.estado === "activo" ? (r.disponible ? ` <span class="st ok">🟢 Disponible</span>` : ` <span class="st mute">Desconectado</span>`) : ""}</td><td><button class="btn btn-light btn-sm" data-vr="${esc(r.id)}">Ver</button></td></tr>`).join("")
      || `<tr><td colspan="5" class="muted">${RF === "pendiente" ? "No hay repartidores por revisar. 👍" : "Sin repartidores."}</td></tr>`}</tbody></table></div></section>`;
  $("#view").onclick = e => { const f = e.target.closest("[data-rf]"); if (f) { RF = f.dataset.rf; return VIEWS.repartidores(); } const v = e.target.closest("[data-vr]"); if (v) verRepartidor(rs.find(r => r.id === v.dataset.vr)); };
};
async function verRepartidor(r) {
  const m = HOY().slice(0, 7), [ps, pg, es, pub] = await Promise.all([DB.list("pedidos", ["repUid", "==", r.id], ["mes", "==", m]).catch(() => []), DB.list("pagosRep", ["uid", "==", r.id]).catch(() => []),
    DB.list("envios", ["repUid", "==", r.id], ["mes", "==", m]).catch(() => []), DB.get("repPublico", r.id).catch(() => null)]);
  const ent = [...ps.filter(p => p.estado === "entregado"), ...es.filter(e => e.estado === "entregado").map(e => ({ envio: e.precio }))], gan = ent.reduce((a, p) => a + (+p.envio || 0), 0), dom = r.domicilio || {}, cas = r.casaca || {};
  const docs = [["fotoPerfil", "Foto de perfil"], ["foto", "Selfie"], ["dniFrente", "DNI adelante"], ["dniReverso", "DNI atrás"], ["licenciaFoto", "Licencia"], ["soatFoto", "SOAT"], ["vehiculoFoto", "Vehículo"], ["antecedentes", "Antecedentes"], ["firma", "Firma"]].filter(([k]) => r[k]);
  modal(r.nombre, `${r.fotoNueva ? `<div class="alert warn foto-n"><img src="${esc(r.fotoNueva)}" alt="Foto nueva"><span><b>Foto de perfil nueva por aprobar.</b> Compárala con su DNI: es la que verán los clientes.</span>${fld("aprobarFoto", "Aprobar foto nueva", true, { type: "checkbox" })}</div>` : ""}
    <p class="muted sm">⭐ ${estrellasTxt(promEstrellas(pub), pub?.estrellasN)} · ${pub?.entregas || 0} entregas en total</p><div class="docs">${docs.map(([k, t]) => `<a class="doc" data-doc="${k}" target="_blank" rel="noopener"><span class="doc-i">…</span><small>${t}</small></a>`).join("")}${cas.captura ? `<a class="doc" data-doc="casaca" target="_blank" rel="noopener"><span class="doc-i">…</span><small>Pago casaca</small></a>` : ""}</div>
    <p class="muted sm">${ico("lock")} Solo tú ves estos documentos. Tócalos para verlos en grande. Compara la selfie con la foto del DNI.</p>
    <dl class="dl"><dt>Estado</dt><dd>${estR(r.estado)}</dd><dt>DNI</dt><dd>${esc(r.dni)} · nació ${fmtF(r.nacimiento, { day: "numeric", month: "short", year: "numeric" })}</dd><dt>Celular</dt><dd>${esc(r.celular)} · <a href="${wa(r.celular)}" target="_blank" rel="noopener">WhatsApp</a></dd><dt>Correo</dt><dd>${esc(r.email || "")}</dd>
      <dt>Vehículo</dt><dd>${vehTxt(r.vehiculo)}${r.marca ? " " + esc(r.marca) : ""}${r.color ? " · " + esc(r.color) : ""}${r.placa ? ` · placa <b>${esc(r.placa)}</b> · licencia ${esc(r.licencia || "")}` : ""}</dd>${r.soatVence ? `<dt>SOAT</dt><dd>vence ${fmtF(r.soatVence, { day: "numeric", month: "short", year: "numeric" })} ${soatAl(r)}</dd>` : ""}
      <dt>Trabaja en</dt><dd>${esc(r.provincia)} (${esc(r.departamento)})</dd><dt>Domicilio</dt><dd>${esc(dom.texto || "")}${dom.referencia ? " · " + esc(dom.referencia) : ""}${dom.distrito ? ", " + esc(dom.distrito) : ""}${dom.lat != null ? ` · <a href="https://maps.google.com/?q=${dom.lat},${dom.lng}" target="_blank" rel="noopener">Ver en mapa</a>` : ""}</dd>
      <dt>Casaca</dt><dd>${S(cas.monto)} · talla ${esc(cas.talla || r.talla || "")} · op. ${esc(cas.operacion || "")}</dd><dt>Declaración</dt><dd>Firmada ${fmtFH((r.declaracion || {}).fecha)} · consentimiento de datos ${r.consentimiento ? "✅" : "❌"}</dd>
      <dt>Este mes</dt><dd>${ent.length} entrega(s) · ganó ${S(gan)} · ${pg.filter(x => x.estado === "pendiente").length} pago(s) por revisar</dd></dl>
    <div class="g2">${fld("estado", "Estado", r.estado, { opts: [["pendiente", "Por revisar"], ["activo", "Activo (puede repartir)"], ["rechazado", "Por corregir (le pedimos que corrija)"], ["suspendido", "Suspendido"]] })}
      ${fld("motivo", "Motivo (lo ve el repartidor si lo rechazas o suspendes)", r.motivo || "", { full: true, ph: "Ej. La foto del DNI no se lee · No pagó su 10 % del lunes" })}</div>`, async d => {
    if (["suspendido", "rechazado"].includes(d.estado) && !d.motivo) { toast("Escribe el motivo", true); return false; }
    const foto = r.fotoNueva && d.aprobarFoto ? r.fotoNueva : r.fotoPerfil || "";
    // Perfil público: lo que ve el cliente (foto aprobada, nombre corto, vehículo, placa). Las estrellas y entregas se conservan.
    const ops = [{ op: "set", col: "repartidores", id: r.id, data: { estado: d.estado, motivo: d.estado === "activo" ? "" : d.motivo, revisado: new Date().toISOString(), ...(d.estado !== "activo" ? { disponible: false } : {}), ...(d.estado === "activo" && !r.aprobado ? { aprobado: new Date().toISOString() } : {}),
      ...(r.fotoNueva && d.aprobarFoto != null ? { fotoNueva: null, ...(d.aprobarFoto ? { fotoPerfil: r.fotoNueva } : {}) } : {}) } }];
    if (d.estado === "activo") ops.push({ op: "set", col: "repPublico", id: r.id, data: { nombre: r.nombre.split(" ").slice(0, 2).join(" "), foto, vehiculo: r.vehiculo, marca: r.marca || "", color: r.color || "", placa: r.placa || "", prov: r.prov, ...(pub ? {} : { entregas: 0, estrellasSum: 0, estrellasN: 0 }) } });
    await DB.batch(ops);
    toast(d.estado === "activo" ? "✅ Repartidor activo: ya puede recibir pedidos" : "Guardado"); if (d.estado === "activo" && !r.aprobado) abrirWA(r.celular, `Hola ${r.nombre.split(" ")[0]} 👋 ¡Bienvenido a Apamuy! Ya aprobamos tu registro de repartidor. Coordinemos la entrega de tu casaca (talla ${cas.talla || r.talla}). Entra a ${AP.reparto || "https://reparto.apamuy.app"} y activa «Disponible» para recibir pedidos.`);
    go(VISTA); }, "Guardar", { wide: true });
  // Abre cada documento con un enlace temporal (las reglas solo dejan al admin)
  $$("[data-doc]").forEach(async a => { const k = a.dataset.doc; try { const u = await verPrivado(k === "casaca" ? cas.captura : r[k]); a.href = u; const pdf = /\.pdf|application\/pdf/i.test(String(k === "casaca" ? cas.captura : r[k]));
    $(".doc-i", a).outerHTML = pdf ? `<span class="doc-i">📄</span>` : `<img class="doc-i" src="${esc(u)}" alt="">`; } catch (e) { $(".doc-i", a).textContent = "⚠️"; } });
}

/* ================= ADMIN · COBROS A REPARTIDORES ================= */
let CR_M = null;
VIEWS.cobrosRep = async () => {
  CR_M = CR_M || HOY().slice(0, 7);
  const [pg, ps0, rs, es] = await Promise.all([DB.list("pagosRep"), DB.list("pedidos", ["mes", "==", CR_M]), DB.list("repartidores"), DB.list("envios", ["mes", "==", CR_M]).catch(() => [])]), pct = +CONF.rep.comision || 0;
  const ps = [...ps0, ...es.map(e => ({ ...e, envio: e.precio }))];
  const pend = pg.filter(x => x.estado === "pendiente").sort((a, b) => String(a.creado).localeCompare(b.creado)), cub = {};
  pg.filter(x => x.estado !== "rechazado").forEach(x => (x.dias || []).forEach(d => cub[x.uid + "|" + d] = x.estado));
  const R = {}; ps.filter(p => p.estado === "entregado" && p.repUid).forEach(p => { const r = R[p.repUid] || (R[p.repUid] = { gan: 0, n: 0, dias: {} }); r.gan += +p.envio || 0; r.n++; r.dias[p.dia] = (r.dias[p.dia] || 0) + (+p.envio || 0); });
  const filas = Object.entries(R).map(([uid, r]) => { const rep = rs.find(x => x.id === uid) || { id: uid, nombre: uid }, dias = Object.entries(r.dias);
    const debe = dias.filter(([d]) => d < HOY() && !cub[uid + "|" + d]).reduce((a, [, g]) => a + g * pct / 100, 0), pagado = dias.filter(([d]) => cub[uid + "|" + d] === "aprobado").reduce((a, [, g]) => a + g * pct / 100, 0);
    return { rep, ...r, com: r2(r.gan * pct / 100), debe: r2(debe), pagado: r2(pagado) }; }).sort((a, b) => b.debe - a.debe || b.gan - a.gan);
  $("#view").innerHTML = topBar("Cobros a repartidores", `Cada repartidor te paga el ${pct}% de lo que gana cada día. Si no paga, su app se bloquea sola al día siguiente.`, `<input type="month" class="q" id="crm" value="${CR_M}">`) + `
    <section class="card"><div class="card-h"><h2>${ico("clock")} Pagos por revisar</h2></div>${pend.length ? `<div class="pg-l">${pend.map(x => `<div class="pg"><a class="pg-c" data-cap="${esc(x.id)}" target="_blank" rel="noopener"><span class="doc-i">…</span></a><div><b>${S(x.monto)}</b> · ${esc(x.nombre || "")}<small>op. ${esc(x.operacion)} · ${fmtFH(x.creado)}</small><small>Días: ${(x.dias || []).map(d => fmtF(d)).join(", ")}</small></div>
      <div class="acts-g"><button class="btn btn-pri btn-sm" data-ok="${esc(x.id)}">${ico("check")} Llegó</button><button class="btn btn-light btn-sm" data-no="${esc(x.id)}">No llegó</button></div></div>`).join("")}</div>
      <div class="alert warn sm">${ico("alert")} <span>Antes de aprobar, <b>confirma en tu Yape que el dinero llegó</b>.</span></div>` : `<p class="muted">No hay pagos por revisar. 👍</p>`}</section>
    <div class="kpis neon"><div class="kpi"><span>Ganaron los repartidores</span><b>${S(filas.reduce((a, f) => a + f.gan, 0))}</b><small>${filas.reduce((a, f) => a + f.n, 0)} entregas</small></div><div class="kpi"><span>Tu ${pct}% del mes</span><b>${S(filas.reduce((a, f) => a + f.com, 0))}</b></div><div class="kpi"><span>Ya te pagaron</span><b>${S(filas.reduce((a, f) => a + f.pagado, 0))}</b></div><div class="kpi"><span>Te deben (días pasados)</span><b>${S(filas.reduce((a, f) => a + f.debe, 0))}</b></div></div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Repartidor</th><th>Entregas</th><th class="r">Ganó</th><th class="r">${pct}%</th><th class="r">Pagado</th><th class="r">Debe</th><th></th></tr></thead><tbody>
    ${filas.map(f => `<tr><td><b>${esc(f.rep.nombre)}</b><small>${vehTxt(f.rep.vehiculo)} ${f.rep.estado ? estR(f.rep.estado) : ""}</small></td><td>${f.n}</td><td class="r">${S(f.gan)}</td><td class="r">${S(f.com)}</td><td class="r">${S(f.pagado)}</td><td class="r ${f.debe ? "neg" : ""}"><b>${S(f.debe)}</b></td>
      <td>${f.debe && f.rep.celular ? `<button class="btn btn-wa btn-sm" data-cob="${esc(f.rep.id)}">${ico("wa")} Cobrar</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="muted">Sin entregas de repartidores ese mes.</td></tr>`}</tbody></table></div></section>`;
  $("#crm").onchange = e => { CR_M = e.target.value; VIEWS.cobrosRep(); };
  $$("[data-cap]").forEach(async a => { const x = pend.find(y => y.id === a.dataset.cap); try { const u = await verPrivado(x.captura); a.href = u; $(".doc-i", a).outerHTML = `<img class="doc-i" src="${esc(u)}" alt="Captura">`; } catch (e) { $(".doc-i", a).textContent = "⚠️"; } });
  $("#view").onclick = e => { const ok = e.target.closest("[data-ok]"), no = e.target.closest("[data-no]"), cob = e.target.closest("[data-cob]");
    if (ok) return DB.set("pagosRep", ok.dataset.ok, { estado: "aprobado", revisado: new Date().toISOString() }).then(() => { toast("✅ Pago aprobado"); VIEWS.cobrosRep(); });
    if (no) return modal("El pago no llegó", fld("motivo", "Motivo (lo ve el repartidor)", "No llegó el Yape", { full: true, opts: ["No llegó el Yape", "El monto no coincide", "La captura no es válida"] }), async d => {
      await DB.set("pagosRep", no.dataset.no, { estado: "rechazado", motivo: d.motivo, revisado: new Date().toISOString() }); toast("Pago rechazado · su app se bloquea hasta que pague"); VIEWS.cobrosRep(); }, "Rechazar");
    if (cob) { const f = filas.find(x => x.rep.id === cob.dataset.cob); abrirWA(f.rep.celular, `Hola ${f.rep.nombre.split(" ")[0]} 👋 te escribe Apamuy. Tienes pendiente ${S(f.debe)} (${pct}% de tus repartos). Págalo desde tu app → Ganancias → Pagar, para que tu cuenta no se bloquee. ¡Gracias!`); } };
};

/* ================= ADMIN · ENVÍOS DE PAQUETES ================= */
let EA_D = null;
VIEWS.enviosAdm = async () => {
  EA_D = EA_D || HOY(); const l = (await DB.list("envios", ["dia", "==", EA_D])).sort((a, b) => String(b.creado).localeCompare(a.creado));
  const ent = l.filter(e => e.estado === "entregado"), pct = +CONF.rep.comision || 0, tot = ent.reduce((a, e) => a + (+e.precio || 0), 0);
  $("#view").innerHTML = topBar("Envíos de paquetes", "El cliente pone su precio; los repartidores aceptan o contraofertan.", `<input type="date" class="q" id="ead" value="${EA_D}">`) + `
    <div class="kpis neon"><div class="kpi"><span>Envíos del día</span><b>${l.length}</b><small>${l.filter(e => e.estado === "buscando").length} buscando · ${l.filter(e => ["asignado", "camino"].includes(e.estado)).length} en curso</small></div><div class="kpi"><span>Entregados</span><b>${ent.length}</b><small>${S(tot)} para repartidores</small></div><div class="kpi"><span>Tu ${pct}%</span><b>${S(tot * pct / 100)}</b><small>lo pagan los repartidores</small></div></div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Hora</th><th>Código</th><th>Ruta</th><th>Paquete</th><th class="r">Precio</th><th>Repartidor</th><th>Estado</th></tr></thead><tbody>
    ${l.map(e => `<tr><td>${fmtH(e.creado)}</td><td class="mono">${esc(e.codigo)}</td><td>${esc(e.origen.dis)} → ${esc(e.destino.dis)}${e.interprov ? ` <span class="st warn">${esc(e.destino.provincia)}</span>` : ""}<small>${e.km} km</small></td><td>${esc(TAM[e.tamano]?.[0] || "")}<small>${esc(e.contenido)}</small></td>
      <td class="r"><b>${S(e.precio ?? e.oferta)}</b>${e.precio != null && e.precio !== e.oferta ? `<small>ofreció ${S(e.oferta)}</small>` : ""}</td><td>${e.repartidor ? `${vehTxt(e.repartidor.vehiculo).split(" ")[0]} ${esc(e.repartidor.nombre)}` : "—"}</td><td><span class="st ${(EST_E[e.estado] || [])[1] || "mute"}">${esc((EST_E[e.estado] || [e.estado])[0])}</span></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Sin envíos ese día.</td></tr>`}</tbody></table></div></section>`;
  $("#ead").onchange = e => { EA_D = e.target.value; VIEWS.enviosAdm(); };
};

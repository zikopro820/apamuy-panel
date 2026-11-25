/* QR por negocio: carteles A5 o stickers para imprimir. El cliente escanea y llega directo a la tienda del negocio.
   Usa lib/qrcode.js (qrcode-generator, licencia MIT). */
const enlaceQR = n => `${String(AP.web || "https://apamuy.app").replace(/\/$/, "")}/negocio?n=${encodeURIComponent(n.id)}&qr=1`;
function svgQR(texto) {
  const q = qrcode(0, "M"); q.addData(texto); q.make();
  const n = q.getModuleCount(); let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#1A1430"/></svg>`;
}
// Fondo con dibujos de delivery (moto, bolsa, caja, ubicación, comida) en blanco suave sobre rojo
const PATRON_QR = (() => {
  const g = (x, y, r, d) => `<g transform="translate(${x} ${y}) rotate(${r})" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  const moto = `<circle cx="-14" cy="8" r="7"/><circle cx="16" cy="8" r="7"/><path d="M-14 8h12l8-14h8M-2 8l-6-12h-8M14-6l2 14"/><rect x="-24" y="-16" width="14" height="12" rx="2"/>`;
  const bolsa = `<path d="M-12-6h24l-2 22h-20z"/><path d="M-6-6v-4a6 6 0 0 1 12 0v4"/>`;
  const caja = `<path d="M0-14l14 7v14L0 14l-14-7V-7z"/><path d="M-14-7L0 0l14-7M0 0v14"/>`;
  const pin = `<path d="M0 16s-12-11-12-20a12 12 0 0 1 24 0c0 9-12 20-12 20z"/><circle cx="0" cy="-4" r="4"/>`;
  const reloj = `<circle r="13"/><path d="M0-7V0l5 4"/>`;
  const plato = `<path d="M-16 4h32M-13 4a13 13 0 0 1 26 0M0-9v-3"/><path d="M-18 9h36"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><g opacity=".16">${g(40, 40, -12, moto)}${g(150, 30, 10, bolsa)}${g(210, 110, -8, caja)}${g(95, 120, 14, pin)}${g(30, 185, 6, reloj)}${g(150, 200, -10, plato)}${g(215, 205, 12, bolsa)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();
const LOGO_QR = () => new URL("img/logo-apamuy.png", location.href).href;
function tarjetaQR(n, tam) {
  const ini = esc((n.nombre || "?")[0].toUpperCase()), logoN = n.logo ? `<img class="nl" src="${esc(imgUrl(n.logo))}" alt="" onerror="this.outerHTML='<span class=&quot;nl ini&quot;>${ini}</span>'">` : `<span class="nl ini">${esc((n.nombre || "?")[0].toUpperCase())}</span>`;
  const url = enlaceQR(n), corto = url.replace(/^https?:\/\//, "").replace("&qr=1", "");
  return tam === "a5"
    ? `<section class="a5 roja"><header><img src="${LOGO_QR()}" alt="Apamuy"></header><div class="cu">${logoN}<h1>${esc(n.nombre)}</h1><p class="sub">Pide desde tu celular</p>
        <div class="qr">${svgQR(url)}</div><h2>Escanea y pide aquí</h2><p class="mod">Delivery a tu puerta · Recojo en tienda</p><p class="url">${esc(corto)}</p></div><footer>Paga con Yape, Plin o efectivo</footer></section>`
    : `<section class="st roja"><header><img src="${LOGO_QR()}" alt="Apamuy"></header><div class="qrb"><div class="qr">${svgQR(url)}</div><b>${esc(n.nombre)}</b></div><span>Escanea y pide aquí</span></section>`;
}
function imprimirQR(lista, tam = "a5") {
  const css = `@page{size:A4 portrait;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;color:#1A1430;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hoja{width:210mm;min-height:297mm;page-break-after:always;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center}.hoja:last-child{page-break-after:auto}
  .roja{background:#E63946 ${PATRON_QR} center/62mm repeat;}
  .a5{width:148mm;height:210mm;margin:43mm auto 0;border-radius:6mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;color:#fff;padding:8mm 10mm 6mm;text-align:center}
  .a5 header img{height:17mm;display:block}
  .a5 .cu{margin-top:12mm;width:100%;flex:1;background:#fff;color:#1A1430;border-radius:6mm;display:flex;flex-direction:column;align-items:center;padding:0 8mm 5mm;box-shadow:0 2mm 6mm rgba(0,0,0,.25)}
  .nl{width:20mm;height:20mm;border-radius:50%;object-fit:cover;border:1.2mm solid #fff;box-shadow:0 1mm 3mm rgba(0,0,0,.25);margin-top:-10mm;background:#1A1430;flex:none}.ini{display:grid;place-items:center;color:#fff;font-size:10mm;font-weight:800}
  .a5 h1{font-size:7.5mm;line-height:1.1;margin-top:2.5mm}.a5 .sub{color:#6b6478;font-size:3.8mm;margin-top:1mm}
  .a5 .qr{width:84mm;height:84mm;margin:4mm 0 3mm}.qr svg{width:100%;height:100%;display:block}
  .a5 h2{font-size:7mm;color:#E63946}.a5 .mod{font-size:3.8mm;margin-top:1mm}.a5 .url{font-size:2.8mm;color:#8a8496;margin-top:1.5mm;word-break:break-all}
  .a5 footer{margin-top:5mm;font-size:4.2mm;font-weight:800;letter-spacing:.2mm}
  .hoja.st-h{padding:12mm 10mm;gap:6mm}.st{width:85mm;height:85mm;border-radius:5mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:3.5mm 5mm 4mm;color:#fff;outline:.3mm dashed #bbb;outline-offset:1.5mm}
  .st header img{height:8.5mm;display:block}.st .qrb{margin-top:2.5mm;background:#fff;border-radius:4mm;padding:2.5mm 2.5mm 2mm;display:flex;flex-direction:column;align-items:center;box-shadow:0 1mm 3mm rgba(0,0,0,.2)}
  .st .qr{width:46mm;height:46mm}.st b{font-size:4mm;color:#1A1430;max-width:62mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1mm}
  .st span{font-size:4mm;font-weight:800;margin-top:2.5mm}
  @media screen{body{background:#888}.hoja{background:#fff;margin:8mm auto;box-shadow:0 2mm 8mm rgba(0,0,0,.3)}}`;
  const porHoja = tam === "a5" ? 1 : 6, hojas = [];
  for (let i = 0; i < lista.length; i += porHoja) hojas.push(`<div class="hoja ${tam === "a5" ? "" : "st-h"}">${lista.slice(i, i + porHoja).map(n => tarjetaQR(n, tam)).join("")}</div>`);
  // Se imprime desde un marco oculto (no lo bloquea el navegador y carga bien las imágenes)
  $("#qrPrint")?.remove(); const fr = document.createElement("iframe"); fr.id = "qrPrint";
  fr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"; document.body.appendChild(fr);
  const d = fr.contentDocument; d.open(); d.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="${location.href}"><title>QR Apamuy</title><style>${css}</style></head><body>${hojas.join("")}</body></html>`); d.close();
  const listo = () => Promise.all([...d.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
  toast("Preparando la impresión…"); listo().then(() => setTimeout(() => { fr.contentWindow.focus(); fr.contentWindow.print(); }, 200));
}
// Ventana para elegir el tamaño antes de imprimir
function elegirTamQR(lista) {
  modal(`Imprimir QR${lista.length > 1 ? ` · ${lista.length} negocios` : ` · ${esc(lista[0].nombre)}`}`, `<p class="muted">Elige el tamaño. Se abre la vista de impresión (puedes guardarlo como PDF).</p>
    <div class="qr-op"><button type="button" class="qr-t" data-tam="a5"><b>Cartel A5</b><small>Media hoja · para mostrador o pared · 1 por hoja</small></button>
    <button type="button" class="qr-t" data-tam="st"><b>Stickers 8,5 × 8,5 cm</b><small>Para mesas, puertas o bolsas · 6 por hoja A4</small></button></div>`, null, "Cerrar", { alAbrir: F => {
      F.querySelectorAll("[data-tam]").forEach(b => b.onclick = () => { const t = b.dataset.tam; const l = t === "st" && lista.length === 1 ? Array(6).fill(lista[0]) : lista; imprimirQR(l, t); cerrarModal(); }); } });
}
// Botón «Imprimir mi QR» del panel de cada negocio
document.addEventListener("click", e => { if (e.target.closest("#qrMio") && typeof NEG !== "undefined" && NEG) elegirTamQR([NEG]); });

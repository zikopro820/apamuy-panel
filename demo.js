/* =========================================================
   APAMUY — Datos de MODO DEMO (solo si apiKey empieza con "PEGA")
   Usa los mismos ejemplos que el admin carga en Firebase (semilla.js).
   ========================================================= */
window.AM_DEMO = function () {
  const s = window.AM_SEMILLA(), ahora = new Date().toISOString();
  const db = { config: { general: { comision: 10, delivery: { base: 4, porKm: 1, maxKm: 8 }, ciudadInicial: { dep: "Cusco", prov: "Cusco" } } }, usuarios: {}, pedidos: {}, ...s };
  db.negocios["neg-jugos"] = { owner: "neg-jugos", email: "jugos@demo.pe", estado: "pendiente", rubro: "comida", tipo: "Jugos", nombre: "Juguería La Fresca", descripcion: "Jugos y sánguches.", departamento: "Cusco", provincia: "Cusco", distrito: "Cusco", prov: "Cusco|Cusco",
    direccion: "Mercado San Pedro, puesto 12", ubic: { lat: -13.521, lng: -71.984 }, abre: "07:00", cierra: "19:00", dias: [0, 1, 2, 3, 4, 5, 6], telefono: "984555666", delivery: true, recojo: true, pagoYape: true, yapeNum: "984555666", contraEntrega: true, creado: ahora,
    documento: { tipo: "DNI", numero: "12345678", nombre: "Rosa Quispe" } };
  // Solo en modo demo: un taller para probar «Solicitar servicio»
  db.negocios["neg-taller"] = { owner: "neg-taller", email: "taller@demo.pe", estado: "activo", rubro: "talleres", tipo: "Motos", nombre: "Taller MotoFix", descripcion: "Mecánica de motos y llantería.", departamento: "Cusco", provincia: "Cusco", distrito: "Santiago", prov: "Cusco|Cusco",
    direccion: "Av. Grau 300", ubic: { lat: -13.528, lng: -71.975 }, abre: "08:00", cierra: "20:00", dias: [1, 2, 3, 4, 5, 6], estadoManual: "abierto", telefono: "984000111", creado: ahora };
  db["negocios/neg-taller/categorias"] = { s: { nombre: "Servicios", orden: 0 } };
  db["negocios/neg-taller/productos"] = { aceite: { cat: "s", nombre: "Cambio de aceite", precio: 35, desc: "Incluye aceite 20W-50.", activo: true, destacado: true, orden: 0 }, parche: { cat: "s", nombre: "Parchado de llanta", precio: 10, activo: true, orden: 1 } };
  Object.values(db.negocios).forEach(n => { if (String(n.owner).startsWith("demo-")) n.estadoManual = "abierto"; });
  return db;
};

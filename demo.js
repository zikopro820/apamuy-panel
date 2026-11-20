/* =========================================================
   APAMUY — Datos de MODO DEMO (solo se usan si apiKey empieza con "PEGA")
   ========================================================= */
window.AM_DEMO = function () {
  const F = (f, w = 640) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=" + w;
  const ahora = new Date().toISOString(), db = { config: { general: { comision: 10, delivery: { base: 4, porKm: 1, maxKm: 8 } } }, negocios: {}, usuarios: {}, pedidos: {} };
  const neg = (id, d) => db.negocios[id] = { owner: id, estado: "activo", abre: "10:00", cierra: "23:00", dias: [0, 1, 2, 3, 4, 5, 6], estadoManual: "abierto", delivery: true, recojo: true, pedidoMinimo: 15,
    pagoYape: true, pagoPlin: true, contraEntrega: true, yapeNum: "987 654 321", yapeTitular: "Dueño Demo", plinNum: "987 654 321", plinTitular: "Dueño Demo", creado: ahora, ...d };
  neg("neg-pollon", { email: "pollon@demo.pe", nombre: "Pollería El Pollón", tipo: "Pollería", descripcion: "Pollo a la brasa al carbón y parrillas.", tiempo: "30-40 min", portada: F("Pollo_a_la_brasa_peruano.jpg", 900),
    telefono: "984111222", whatsapp: "51984111222", direccion: "Av. de la Cultura 1020", ubic: { lat: -13.5245, lng: -71.9585 }, extrasGratis: ["Mayonesa", "Ají de la casa", "Huancaína", "Ketchup", "Mostaza"] });
  neg("neg-lucho", { email: "lucho@demo.pe", nombre: "Parrillas Don Lucho", tipo: "Parrillas", descripcion: "Carnes a la parrilla y anticuchos.", tiempo: "35-45 min", portada: F("Parrillada.jpg", 900),
    telefono: "984333444", whatsapp: "51984333444", direccion: "Calle Saphy 450", ubic: { lat: -13.5165, lng: -71.9805 } });
  neg("neg-jugos", { email: "jugos@demo.pe", nombre: "Juguería La Fresca", tipo: "Jugos", descripcion: "Jugos, sánguches y postres.", tiempo: "20-30 min", estado: "pendiente", portada: F("Glass_of_lemonade.jpg", 900),
    telefono: "984555666", whatsapp: "51984555666", direccion: "Mercado San Pedro, puesto 12", ubic: { lat: -13.5210, lng: -71.9840 } });
  const cats = (n, l) => { db[`negocios/${n}/categorias`] = {}; l.forEach(([id, nombre], i) => db[`negocios/${n}/categorias`][id] = { nombre, orden: i }); };
  const prods = (n, l) => { db[`negocios/${n}/productos`] = {}; l.forEach((p, i) => db[`negocios/${n}/productos`][p.id] = { activo: true, agotado: false, orden: i, opciones: [], ...p }); };
  const parte = { titulo: "Parte del pollo", tipo: "uno", req: true, items: [{ n: "Pecho" }, { n: "Pierna" }] };
  const papas = { titulo: "Acompañamiento", tipo: "uno", req: true, items: [{ n: "Papas fritas" }, { n: "Papas sancochadas" }, { n: "Arroz chaufa", p: 3 }] };
  const tam = { titulo: "Tamaño", tipo: "uno", req: true, items: [{ n: "Personal 500 ml" }, { n: "1 litro", p: 3 }, { n: "1.5 litros", p: 5 }] };
  cats("neg-pollon", [["pollos", "Pollos a la brasa"], ["combos", "Combos"], ["bebidas", "Bebidas"]]);
  prods("neg-pollon", [
    { id: "p14", cat: "pollos", nombre: "1/4 de pollo a la brasa", precio: 18.9, desc: "Con papas y ensalada.", foto: F("Un_cuarto_de_Pollo_a_la_Brasa.JPG"), opciones: [parte, papas], extrasGratis: true, sugerirBebida: true, destacado: true },
    { id: "p12", cat: "pollos", nombre: "1/2 pollo a la brasa", precio: 34.9, desc: "Papas familiares y ensalada.", foto: F("Pollo_a_la_brasa_pierna_con_papas.JPG"), opciones: [papas], extrasGratis: true, sugerirBebida: true, destacado: true },
    { id: "p1", cat: "pollos", nombre: "1 pollo a la brasa", precio: 62.9, desc: "Para 4 personas.", foto: F("Pollo_a_la_brasa_peruano.jpg"), opciones: [papas], extrasGratis: true, sugerirBebida: true },
    { id: "cfam", cat: "combos", nombre: "Combo familiar", precio: 79.9, desc: "1 pollo + papas + ensalada + gaseosa 1.5 L.", foto: F("Pollo_a_la_brasa_para_llevar.JPG"), extrasGratis: true },
    { id: "inca", cat: "bebidas", nombre: "Inca Kola", precio: 4, foto: F("IncaKolaBottleGlass.jpg"), opciones: [tam] },
    { id: "chicha", cat: "bebidas", nombre: "Chicha morada", precio: 6, desc: "Jarra de 1 litro.", foto: F("Chicha_Morada_2017.jpg") }
  ]);
  cats("neg-lucho", [["parrillas", "Parrillas"], ["bebidas", "Bebidas"]]);
  prods("neg-lucho", [
    { id: "anti", cat: "parrillas", nombre: "Anticuchos de corazón", precio: 22, desc: "3 palitos con papas y choclo.", foto: F("Anticucho_del_Perú.JPG"), sugerirBebida: true, destacado: true },
    { id: "bife", cat: "parrillas", nombre: "Bife a la parrilla", precio: 39.9, desc: "300 g con papas y ensalada.", foto: F("Bife_de_chorizo_a_punto_02.jpg"), opciones: [{ titulo: "Término", tipo: "uno", req: true, items: [{ n: "Jugoso" }, { n: "A punto" }, { n: "Bien cocido" }] }], sugerirBebida: true },
    { id: "mixta", cat: "parrillas", nombre: "Parrilla mixta para 2", precio: 69.9, foto: F("Parrilla_Mixta.JPG") },
    { id: "coca", cat: "bebidas", nombre: "Coca-Cola", precio: 4, foto: F("Coca-Cola_Bottle.jpeg"), opciones: [tam] }
  ]);
  cats("neg-jugos", [["jugos", "Jugos"]]);
  prods("neg-jugos", [{ id: "lim", cat: "jugos", nombre: "Limonada frozen", precio: 8, foto: F("Glass_of_lemonade.jpg") }]);
  return db;
};

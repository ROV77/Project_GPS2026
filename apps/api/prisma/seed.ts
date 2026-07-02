import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Contraseña en claro para TODAS las cuentas demo (se hashea abajo).
// Úsala en el login del panel: demo@caserita.cl / demo123
const DEMO_PASSWORD = 'demo123';

// Catálogo oficial de Chile: 16 regiones con sus comunas (346 en total).
const CHILE_REGIONS: Array<{ region: string; communes: string[] }> = [
  {
    region: 'Arica y Parinacota',
    communes: ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  },
  {
    region: 'Tarapacá',
    communes: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  },
  {
    region: 'Antofagasta',
    communes: [
      'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe',
      'San Pedro de Atacama', 'Tocopilla', 'María Elena',
    ],
  },
  {
    region: 'Atacama',
    communes: [
      'Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar',
      'Alto del Carmen', 'Freirina', 'Huasco',
    ],
  },
  {
    region: 'Coquimbo',
    communes: [
      'La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paihuano', 'Vicuña', 'Illapel',
      'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui',
      'Río Hurtado',
    ],
  },
  {
    region: 'Valparaíso',
    communes: [
      'Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero',
      'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'La Calera', 'Hijuelas',
      'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo',
      'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María',
      'Quilpué', 'Limache', 'Olmué', 'Villa Alemana',
    ],
  },
  {
    region: 'Región Metropolitana',
    communes: [
      'Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
      'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana',
      'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
      'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
      'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura', 'Puente Alto',
      'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin',
      'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro',
      'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor',
    ],
  },
  {
    region: "Libertador General Bernardo O'Higgins",
    communes: [
      'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí',
      'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo',
      'Requínoa', 'San Vicente', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua',
      'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz', 'Pichilemu', 'La Estrella',
      'Litueche', 'Marchihue', 'Navidad', 'Paredones',
    ],
  },
  {
    region: 'Maule',
    communes: [
      'Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro',
      'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé',
      'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Linares',
      'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas',
    ],
  },
  {
    region: 'Ñuble',
    communes: [
      'Chillán', 'Bulnes', 'Chillán Viejo', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón',
      'San Ignacio', 'Yungay', 'Quirihue', 'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo',
      'Ránquil', 'Treguaco', 'San Carlos', 'Coihueco', 'Ñiquén', 'San Fabián', 'San Nicolás',
    ],
  },
  {
    region: 'Biobío',
    communes: [
      'Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco',
      'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco',
      'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco',
      'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo',
      'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío',
    ],
  },
  {
    region: 'La Araucanía',
    communes: [
      'Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro',
      'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre Las Casas', 'Perquenco', 'Pitrufquén',
      'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol',
      'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco',
      'Purén', 'Renaico', 'Traiguén', 'Victoria',
    ],
  },
  {
    region: 'Los Ríos',
    communes: [
      'Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli',
      'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno',
    ],
  },
  {
    region: 'Los Lagos',
    communes: [
      'Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue',
      'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue',
      'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay',
      'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén',
      'Futaleufú', 'Hualaihué', 'Palena',
    ],
  },
  {
    region: 'Aysén del General Carlos Ibáñez del Campo',
    communes: [
      'Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins",
      'Tortel', 'Chile Chico', 'Río Ibáñez',
    ],
  },
  {
    region: 'Magallanes y de la Antártica Chilena',
    communes: [
      'Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos', 'Antártica',
      'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine',
    ],
  },
];

async function main() {
  const existing = await prisma.categories.count();
  if (existing > 0) {
    console.log('La base ya tiene datos; se omite el seed.');
    return;
  }

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ─── Roles ────────────────────────────────────────────────────────────────
  const [adminRole, sellerRole, customerRole] = await Promise.all([
    prisma.roles.create({ data: { name: 'admin' } }),
    prisma.roles.create({ data: { name: 'seller' } }),
    prisma.roles.create({ data: { name: 'customer' } }),
    prisma.roles.create({ data: { name: 'delivery' } }),
  ]);

  // ─── Regiones y comunas (catálogo oficial de Chile: 16 regiones / 346 comunas) ─
  for (const { region, communes } of CHILE_REGIONS) {
    const created = await prisma.regions.create({ data: { name: region } });
    await prisma.communes.createMany({
      data: communes.map((name) => ({ name, city: name, region_id: created.id })),
    });
  }

  // Referencias usadas por las tiendas demo.
  const rm = await prisma.regions.findFirstOrThrow({ where: { name: 'Región Metropolitana' } });
  const valpo = await prisma.regions.findFirstOrThrow({ where: { name: 'Valparaíso' } });
  const biobio = await prisma.regions.findFirstOrThrow({ where: { name: 'Biobío' } });
  const santiago = await prisma.communes.findFirstOrThrow({
    where: { name: 'Santiago', region_id: rm.id },
  });
  const vina = await prisma.communes.findFirstOrThrow({
    where: { name: 'Viña del Mar', region_id: valpo.id },
  });
  // Comunas del Biobío (referencias para las tiendas inventadas)
  const biobioCommunes = await prisma.communes.findMany({
    where: { region_id: biobio.id },
  });
  const findComune = (name: string) => biobioCommunes.find((c) => c.name === name)!;

  // ─── Categorías ───────────────────────────────────────────────────────────
  const categoryNames = [
    'Panadería',
    'Verdulería',
    'Almacén',
    'Carnicería',
    'Pastelería',
    'Botillería',
  ];
  await Promise.all(categoryNames.map((name) => prisma.categories.create({ data: { name } })));
  const panaderia = await prisma.categories.findFirst({ where: { name: 'Panadería' } });
  const verduleria = await prisma.categories.findFirst({ where: { name: 'Verdulería' } });
  const almacen = await prisma.categories.findFirst({ where: { name: 'Almacén' } });
  const carniceria = await prisma.categories.findFirst({ where: { name: 'Carnicería' } });
  const pasteleria = await prisma.categories.findFirst({ where: { name: 'Pastelería' } });
  const botilleria = await prisma.categories.findFirst({ where: { name: 'Botillería' } });

  // ─── Planes ───────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.plans.create({
      data: {
        name: 'Gratis',
        price: 0,
        billing_period: 'monthly',
        description: 'Hasta 20 productos y perfil básico.',
        max_products: 20,
        is_active: true,
      },
    }),
    prisma.plans.create({
      data: {
        name: 'Pro',
        price: 9990,
        billing_period: 'monthly',
        description: 'Productos ilimitados, promociones y estadísticas.',
        max_products: null,
        is_active: true,
      },
    }),
    prisma.plans.create({
      data: {
        name: 'Premium',
        price: 19990,
        billing_period: 'monthly',
        description: 'Todo lo de Pro + verificación destacada y soporte prioritario.',
        max_products: null,
        is_active: true,
      },
    }),
  ]);

  // ─── Usuarios ─────────────────────────────────────────────────────────────
  const demo = await prisma.users.create({
    data: {
      email: 'demo@caserita.cl',
      password_hash,
      name: 'Vendedor Demo',
      phone: '+56911111111',
      email_verified: true,
    },
  });
  const rosa = await prisma.users.create({
    data: {
      email: 'rosa@caserita.cl',
      password_hash,
      name: 'Rosa Pérez',
      phone: '+56922222222',
      email_verified: true,
    },
  });
  // Clientes (para reseñas)
  const [cliente1, cliente2, cliente3] = await Promise.all([
    prisma.users.create({ data: { email: 'cliente1@caserita.cl', password_hash, name: 'Juan Soto' } }),
    prisma.users.create({ data: { email: 'cliente2@caserita.cl', password_hash, name: 'Ana Díaz' } }),
    prisma.users.create({ data: { email: 'cliente3@caserita.cl', password_hash, name: 'Luis Rojas' } }),
  ]);

  // Roles de cada usuario
  await Promise.all([
    prisma.user_roles.create({ data: { user_id: demo.id, role_id: adminRole.id } }),
    prisma.user_roles.create({ data: { user_id: demo.id, role_id: sellerRole.id } }),
    prisma.user_roles.create({ data: { user_id: rosa.id, role_id: sellerRole.id } }),
    prisma.user_roles.create({ data: { user_id: cliente1.id, role_id: customerRole.id } }),
    prisma.user_roles.create({ data: { user_id: cliente2.id, role_id: customerRole.id } }),
    prisma.user_roles.create({ data: { user_id: cliente3.id, role_id: customerRole.id } }),
  ]);

  // ─── Tiendas ──────────────────────────────────────────────────────────────
  const tiendaDemo = await prisma.stores.create({
    data: {
      owner_id: demo.id,
      name: 'Panadería La Esquina',
      description: 'Pan amasado y pastelería artesanal todos los días.',
      category_id: panaderia?.id,
      region_id: rm.id,
      commune_id: santiago.id,
      store_phone: '+56911111111',
      verified: true,
      latitude: -33.452860,
      longitude: -70.655470,
    },
  });
  const tiendaRosa = await prisma.stores.create({
    data: {
      owner_id: rosa.id,
      name: 'Verdulería Doña Rosa',
      description: 'Frutas y verduras frescas de la feria.',
      category_id: verduleria?.id,
      region_id: valpo.id,
      commune_id: vina.id,
      store_phone: '+56922222222',
      verified: false,
      latitude: -33.024500,
      longitude: -71.551800,
    },
  });

  // ─── Tiendas inventadas en la Región del Biobío (20 tiendas) ──────────────
  // Todas con coordenadas reales para que aparezcan en el mapa. Se asignan a
  // las comunas del Biobío (Concepción, Talcahuano, Coronel, etc.).
  const biobioStoresData = [
    // --- Concepción (5) ---
    { name: 'Panadería Donde Juan', description: 'Pan amasado al horno de barro, hecho a leña.', cat: panaderia?.id, commune: 'Concepción', lat: -36.820120, lng: -73.049320, verified: true },
    { name: 'Almacén El Rincón', description: 'Almacén de barrio con abarrotes y prelimpios.', cat: almacen?.id, commune: 'Concepción', lat: -36.815000, lng: -73.052100, verified: false },
    { name: 'Carnicería La Preferida', description: 'Carnicería con carne de primera y pedidos a domicilio.', cat: carniceria?.id, commune: 'Concepción', lat: -36.830500, lng: -73.040800, verified: true },
    { name: 'Verdulería Bio Bio', description: 'Frutas y verduras frescas de temporada.', cat: verduleria?.id, commune: 'Concepción', lat: -36.826500, lng: -73.056000, verified: false },
    { name: 'Pastelería Dulce Hogar', description: 'Tortas, kuchen y pasteles artesanales.', cat: pasteleria?.id, commune: 'Concepción', lat: -36.822600, lng: -73.047200, verified: true },
    // --- Talcahuano (4) ---
    { name: 'Panadería Mar y Pan', description: 'Pan fresco desde las 5 de la mañana.', cat: panaderia?.id, commune: 'Talcahuano', lat: -36.725000, lng: -73.116900, verified: false },
    { name: 'Botillería El Puerto', description: 'Bebidas, cervezas y vinos. Delivery rápido.', cat: botilleria?.id, commune: 'Talcahuano', lat: -36.729400, lng: -73.112600, verified: true },
    { name: 'Almacén Talcaventura', description: 'Todo para el hogar y la despensa.', cat: almacen?.id, commune: 'Talcahuano', lat: -36.718990, lng: -73.121000, verified: false },
    { name: 'Carnicería El Marino', description: 'Carnes de mar y tierra, especialidad en pescado fresco.', cat: carniceria?.id, commune: 'Talcahuano', lat: -36.733500, lng: -73.105400, verified: false },
    // --- Coronel (3) ---
    { name: 'Panadería Carbonífera', description: 'Tradición panadera desde 1985.', cat: panaderia?.id, commune: 'Coronel', lat: -37.021900, lng: -73.146300, verified: true },
    { name: 'Verdulería Los Mineros', description: 'Productos frescos directamente de la feria.', cat: verduleria?.id, commune: 'Coronel', lat: -37.025500, lng: -73.139000, verified: false },
    { name: 'Pastelería La Costa', description: 'Kuchen de curanto y especialidades locales.', cat: pasteleria?.id, commune: 'Coronel', lat: -37.016810, lng: -73.153600, verified: false },
    // --- San Pedro de la Paz (3) ---
    { name: 'Almacén Pedrohueno', description: 'Abarrotes y útiles escolares.', cat: almacen?.id, commune: 'San Pedro de la Paz', lat: -36.871400, lng: -73.103600, verified: false },
    { name: 'Verdulería San Pedrito', description: 'Verduras orgánicas de la zona.', cat: verduleria?.id, commune: 'San Pedro de la Paz', lat: -36.878200, lng: -73.099500, verified: true },
    { name: 'Botillería El Lago', description: 'Cervezas artesanales y nacionales.', cat: botilleria?.id, commune: 'San Pedro de la Paz', lat: -36.864800, lng: -73.108500, verified: false },
    // --- Chiguayante (2) ---
    { name: 'Panadería Chiguay', description: 'Pan amasado y colas de mono en temporada.', cat: panaderia?.id, commune: 'Chiguayante', lat: -36.905500, lng: -73.021700, verified: false },
    { name: 'Carnicería La Sureña', description: 'Carnicería con cortes premium y para parrilla.', cat: carniceria?.id, commune: 'Chiguayante', lat: -36.910000, lng: -73.016500, verified: false },
    // --- Hualpén (2) ---
    { name: 'Verdulería Hualpén Fresh', description: 'Frutas y verduras importadas y nacionales.', cat: verduleria?.id, commune: 'Hualpén', lat: -36.833300, lng: -73.116700, verified: true },
    { name: 'Almacén Biobío Market', description: 'Almacén con productos premium y gourmet.', cat: almacen?.id, commune: 'Hualpén', lat: -36.828100, lng: -73.121600, verified: false },
    // --- Penco (1) ---
    { name: 'Panadería Playa Penco', description: 'Pan recién horneado cerca de la playa.', cat: panaderia?.id, commune: 'Penco', lat: -36.733300, lng: -72.966700, verified: false },
  ];

  const biobioStores: Array<{ id: bigint; name: string }> = [];
  for (const s of biobioStoresData) {
    const communeRef = findComune(s.commune);
    const created = await prisma.stores.create({
      data: {
        owner_id: demo.id,
        name: s.name,
        description: s.description,
        category_id: s.cat,
        region_id: biobio.id,
        commune_id: communeRef.id,
        store_phone: '+569' + Math.floor(10000000 + Math.random() * 89999999).toString(),
        verified: s.verified,
        latitude: s.lat,
        longitude: s.lng,
      },
    });
    biobioStores.push({ id: created.id, name: s.name });
  }

  // ─── Productos ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Marraqueta', description: 'Pan tradicional, kilo.', price: 1800, stock: 50, featured: true } }),
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Hallulla', description: 'Pan de mesa, kilo.', price: 1700, stock: 40, featured: true } }),
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Pan integral', description: 'Pan integral artesanal.', price: 2200, stock: 25 } }),
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Empanada de pino', description: 'Horneada, unidad.', price: 1500, stock: 30, featured: true } }),
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Berlín', description: 'Relleno de crema pastelera.', price: 1200, stock: 20 } }),
    prisma.products.create({ data: { store_id: tiendaDemo.id, name: 'Torta mil hojas', description: 'Porción individual.', price: 2500, stock: 12 } }),
    prisma.products.create({ data: { store_id: tiendaRosa.id, name: 'Lechuga', description: 'Unidad.', price: 900, stock: 60, featured: true } }),
    prisma.products.create({ data: { store_id: tiendaRosa.id, name: 'Tomate', description: 'Kilo.', price: 1300, stock: 80 } }),
    prisma.products.create({ data: { store_id: tiendaRosa.id, name: 'Palta Hass', description: 'Kilo.', price: 3500, stock: 35, featured: true } }),
  ]);

  // ─── Promociones ──────────────────────────────────────────────────────────
  await Promise.all([
    prisma.promotions.create({
      data: {
        store_id: tiendaDemo.id,
        title: '2x1 en Berlines',
        description: 'Lleva dos berlines por el precio de uno.',
        discount_type: 'percentage',
        discount_value: 50,
        valid_from: new Date('2026-06-01'),
        valid_until: new Date('2026-06-30'),
      },
    }),
    prisma.promotions.create({
      data: {
        store_id: tiendaRosa.id,
        title: 'Descuento en paltas',
        description: '$500 de descuento por kilo.',
        discount_type: 'fixed',
        discount_value: 500,
        valid_from: new Date('2026-06-10'),
        valid_until: new Date('2026-06-20'),
      },
    }),
  ]);

  // ─── Reseñas (alimentan el avg_rating de /stores/search) ──────────────────
  await Promise.all([
    prisma.reviews.create({ data: { store_id: tiendaDemo.id, customer_id: cliente1.id, rating: 5, comment: 'El mejor pan del barrio.' } }),
    prisma.reviews.create({ data: { store_id: tiendaDemo.id, customer_id: cliente2.id, rating: 4, comment: 'Muy rico, a veces hay fila.' } }),
    prisma.reviews.create({ data: { store_id: tiendaDemo.id, customer_id: cliente3.id, rating: 5, comment: 'Las empanadas son excelentes.' } }),
    prisma.reviews.create({ data: { store_id: tiendaRosa.id, customer_id: cliente1.id, rating: 4, comment: 'Verduras siempre frescas.' } }),
    prisma.reviews.create({ data: { store_id: tiendaRosa.id, customer_id: cliente2.id, rating: 3, comment: 'Buena atención.' } }),
  ]);

  // ─── Productos para las tiendas del Biobío (2-3 por tienda) ──────────────
  const productTemplates: Record<string, Array<{ name: string; desc: string; price: number; stock: number; featured?: boolean }>> = {
    'Panadería': [
      { name: 'Marraqueta', desc: 'Kilo, recién horneada.', price: 1600, stock: 40, featured: true },
      { name: 'Pan amasado', desc: '6 unidades, al horno de barro.', price: 2000, stock: 30 },
      { name: 'Empanada', desc: 'De pino, horneada.', price: 1400, stock: 25, featured: true },
    ],
    'Verdulería': [
      { name: 'Tomate', desc: 'Kilo, de invernadero.', price: 1200, stock: 50 },
      { name: 'Lechuga', desc: 'Unidad, hidropónica.', price: 800, stock: 40, featured: true },
      { name: 'Palta Hass', desc: 'Kilo, de La Araucanía.', price: 3400, stock: 20 },
    ],
    'Almacén': [
      { name: 'Arroz 1kg', desc: 'Grado 1, bolsa.', price: 1500, stock: 100 },
      { name: 'Aceite 1L', desc: 'Vegetal.', price: 2800, stock: 60, featured: true },
      { name: 'Fideos 500g', desc: 'Espagueti.', price: 900, stock: 80 },
    ],
    'Carnicería': [
      { name: 'Carne molida', desc: '500g, primera.', price: 3200, stock: 30, featured: true },
      { name: 'Punta paleta', desc: 'Kilo, para parrilla.', price: 6500, stock: 15 },
      { name: 'Chuleta', desc: 'Unidad, de cerdo.', price: 2500, stock: 25 },
    ],
    'Pastelería': [
      { name: 'Kuchen de manzana', desc: 'Porción.', price: 2800, stock: 18, featured: true },
      { name: 'Torta mil hojas', desc: 'Porción individual.', price: 2600, stock: 12 },
      { name: 'Berlín', desc: 'Relleno de manjar.', price: 1100, stock: 30, featured: true },
    ],
    'Botillería': [
      { name: 'Cerveza artesanal', desc: 'Lata 500cc.', price: 2200, stock: 120, featured: true },
      { name: 'Vino tinto', desc: 'Botella 750cc.', price: 4500, stock: 60 },
      { name: 'Hielo', desc: 'Bolsa 2kg.', price: 1000, stock: 200 },
    ],
  };

  for (const s of biobioStores) {
    const store = biobioStoresData.find((d) => d.name === s.name)!;
    // Buscar el nombre de la categoria a partir de las referencias
    let catName = 'Almacén';
    if (store.cat === panaderia?.id) catName = 'Panadería';
    else if (store.cat === verduleria?.id) catName = 'Verdulería';
    else if (store.cat === almacen?.id) catName = 'Almacén';
    else if (store.cat === carniceria?.id) catName = 'Carnicería';
    else if (store.cat === pasteleria?.id) catName = 'Pastelería';
    else if (store.cat === botilleria?.id) catName = 'Botillería';

    const templates = productTemplates[catName] ?? productTemplates['Almacén'];
    await Promise.all(
      templates.map((p) =>
        prisma.products.create({
          data: { store_id: s.id, name: p.name, description: p.desc, price: p.price, stock: p.stock, featured: p.featured ?? false },
        }),
      ),
    );
  }

  // ─── Reseñas para algunas tiendas del Biobío ( variedad de ratings ) ──────
  const reviewComments = [
    { rating: 5, comment: 'Excelente atención y productos frescos.' },
    { rating: 4, comment: 'Muy buenos precios, lo recomiendo.' },
    { rating: 5, comment: 'El mejor del barrio, siempre compro ahí.' },
    { rating: 3, comment: 'Está bien, aunque a veces falta stock.' },
    { rating: 4, comment: 'Buen lugar, rápido y confiable.' },
    { rating: 5, comment: 'Calidad top, no cambio por nada.' },
    { rating: 4, comment: 'Rico y a buen precio.' },
    { rating: 3, comment: 'Cumple, sin sorpresas.' },
  ];
  const reviewPromises: ReturnType<typeof prisma.reviews.create>[] = [];
  for (let i = 0; i < biobioStores.length; i++) {
    const store = biobioStores[i];
    // 0-2 reseñas por tienda (rotando)
    for (let j = 0; j < (i % 3); j++) {
      const rc = reviewComments[(i + j) % reviewComments.length];
      const cust = [cliente1, cliente2, cliente3][(i + j) % 3];
      reviewPromises.push(
        prisma.reviews.create({
          data: { store_id: store.id, customer_id: cust.id, rating: rc.rating, comment: rc.comment },
        }),
      );
    }
  }
  await Promise.all(reviewPromises);

  console.log('Seed completado.');
  console.log(`Cuentas demo (password "${DEMO_PASSWORD}"): demo@caserita.cl, rosa@caserita.cl`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

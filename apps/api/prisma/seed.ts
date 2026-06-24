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
  const santiago = await prisma.communes.findFirstOrThrow({
    where: { name: 'Santiago', region_id: rm.id },
  });
  const vina = await prisma.communes.findFirstOrThrow({
    where: { name: 'Viña del Mar', region_id: valpo.id },
  });

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
    },
  });

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

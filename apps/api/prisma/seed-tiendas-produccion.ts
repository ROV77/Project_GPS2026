/**
 * Script de mantenimiento — agrega SOLO las 12 cuentas de tienda de producción
 * (ver docs/tiendas-produccion-credenciales.md), sin tocar el resto de la base.
 *
 * A diferencia de seed.ts, no depende del guard `categories.count() === 0`, así
 * que corre igual aunque la base ya tenga datos. Es idempotente: si una cuenta
 * (por email) ya existe, la salta — se puede volver a correr sin duplicar nada.
 *
 * Uso (dentro del contenedor api, sin rebuild ni restart):
 *   docker compose exec api sh -c 'export PATH="$PWD/node_modules/.bin:$PATH" && tsx prisma/seed-tiendas-produccion.ts'
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo123';

type SeedProducto = { name: string; description: string; price: number; stock: number; featured?: boolean };
type SeedTiendaProd = {
  email: string;
  ownerName: string;
  storeName: string;
  description: string;
  category: string;
  regionName: string;
  communeName: string;
  phone: string;
  verified: boolean;
  latitude: number;
  longitude: number;
};

const prodTemplates5: Record<string, SeedProducto[]> = {
  'Panadería': [
    { name: 'Marraqueta', description: 'Pan tradicional, kilo.', price: 1800, stock: 50, featured: true },
    { name: 'Hallulla', description: 'Pan de mesa, kilo.', price: 1700, stock: 40, featured: true },
    { name: 'Pan integral', description: 'Pan integral artesanal, kilo.', price: 2200, stock: 25 },
    { name: 'Empanada de pino', description: 'Horneada, unidad.', price: 1500, stock: 30 },
    { name: 'Berlín', description: 'Relleno de crema pastelera, unidad.', price: 1200, stock: 20 },
  ],
  'Verdulería': [
    { name: 'Tomate', description: 'Kilo, de invernadero.', price: 1300, stock: 80, featured: true },
    { name: 'Lechuga', description: 'Unidad, hidropónica.', price: 900, stock: 60 },
    { name: 'Palta Hass', description: 'Kilo, madura.', price: 3500, stock: 35, featured: true },
    { name: 'Zanahoria', description: 'Kilo, fresca.', price: 1100, stock: 70 },
    { name: 'Papas', description: 'Malla 2 kilos.', price: 2400, stock: 45 },
  ],
  'Almacén': [
    { name: 'Arroz 1kg', description: 'Grado 1, bolsa.', price: 1500, stock: 100, featured: true },
    { name: 'Aceite 1L', description: 'Vegetal.', price: 2800, stock: 60 },
    { name: 'Fideos 500g', description: 'Espagueti.', price: 900, stock: 80 },
    { name: 'Azúcar 1kg', description: 'Granulada, bolsa.', price: 1400, stock: 70 },
    { name: 'Té 20 bolsas', description: 'Caja, negro.', price: 1600, stock: 50 },
  ],
  'Carnicería': [
    { name: 'Carne molida', description: '500g, primera.', price: 3200, stock: 30, featured: true },
    { name: 'Punta paleta', description: 'Kilo, para parrilla.', price: 6500, stock: 15 },
    { name: 'Chuleta de cerdo', description: 'Kilo.', price: 4200, stock: 25 },
    { name: 'Pollo entero', description: 'Kilo, fresco.', price: 3000, stock: 40, featured: true },
    { name: 'Longaniza', description: 'Kilo, ahumada.', price: 4800, stock: 20 },
  ],
  'Pastelería': [
    { name: 'Kuchen de manzana', description: 'Porción individual.', price: 2800, stock: 18, featured: true },
    { name: 'Torta mil hojas', description: 'Porción individual.', price: 2600, stock: 12 },
    { name: 'Berlín', description: 'Relleno de manjar, unidad.', price: 1100, stock: 30 },
    { name: 'Brazo de reina', description: 'Porción, relleno de manjar.', price: 2400, stock: 15, featured: true },
    { name: 'Cheesecake', description: 'Porción, salsa de frambuesa.', price: 3200, stock: 14 },
  ],
  'Botillería': [
    { name: 'Cerveza artesanal', description: 'Lata 500cc.', price: 2200, stock: 120, featured: true },
    { name: 'Vino tinto', description: 'Botella 750cc.', price: 4500, stock: 60 },
    { name: 'Pisco 35°', description: 'Botella 750cc.', price: 7900, stock: 40 },
    { name: 'Bebida 1.5L', description: 'Botella desechable.', price: 1800, stock: 90, featured: true },
    { name: 'Hielo 2kg', description: 'Bolsa.', price: 1000, stock: 200 },
  ],
};

const tiendasProduccion: SeedTiendaProd[] = [
  // ══════════════════════ RODRIGO ══════════════════════
  { email: 'demo3@caserita.cl', ownerName: 'María González', storeName: 'Panadería Don Rodrigo', description: 'Pan amasado y pastelería artesanal todos los días.', category: 'Panadería', regionName: 'Biobío', communeName: 'Concepción', phone: '+56940000003', verified: true, latitude: -36.826100, longitude: -73.049800 },
  { email: 'demo4@caserita.cl', ownerName: 'Pedro Ramírez', storeName: 'Verdulería La Frescura', description: 'Frutas y verduras frescas de la feria.', category: 'Verdulería', regionName: 'Biobío', communeName: 'Talcahuano', phone: '+56940000004', verified: false, latitude: -36.716700, longitude: -73.116700 },
  { email: 'demo5@caserita.cl', ownerName: 'Carla Muñoz', storeName: 'Almacén El Vecino', description: 'Abarrotes y despensa del barrio.', category: 'Almacén', regionName: 'Biobío', communeName: 'San Pedro de la Paz', phone: '+56940000005', verified: false, latitude: -36.841900, longitude: -73.101300 },

  // ══════════════════════ CARLOS ══════════════════════
  { email: 'demo6@caserita.cl', ownerName: 'Jorge Salinas', storeName: 'Carnicería Los Cortes', description: 'Carne de primera y pedidos a domicilio.', category: 'Carnicería', regionName: 'Biobío', communeName: 'Coronel', phone: '+56940000006', verified: true, latitude: -37.024200, longitude: -73.158000 },
  { email: 'demo7@caserita.cl', ownerName: 'Andrea Torres', storeName: 'Pastelería Dulce Carlos', description: 'Tortas, kuchen y pasteles artesanales.', category: 'Pastelería', regionName: 'Biobío', communeName: 'Chiguayante', phone: '+56940000007', verified: false, latitude: -36.925600, longitude: -73.028600 },
  { email: 'demo8@caserita.cl', ownerName: 'Roberto Vega', storeName: 'Botillería El Buen Trago', description: 'Bebidas, cervezas y vinos. Delivery rápido.', category: 'Botillería', regionName: 'Biobío', communeName: 'Hualpén', phone: '+56940000008', verified: false, latitude: -36.794700, longitude: -73.105300 },

  // ══════════════════════ FABIÁN ══════════════════════
  { email: 'demo9@caserita.cl', ownerName: 'Camila Herrera', storeName: 'Panadería Santiago Centro', description: 'Pan recién horneado en pleno centro.', category: 'Panadería', regionName: 'Región Metropolitana', communeName: 'Santiago', phone: '+56940000009', verified: true, latitude: -33.448900, longitude: -70.669300 },
  { email: 'demo10@caserita.cl', ownerName: 'Diego Castro', storeName: 'Verdulería Mar Fresco', description: 'Frutas y verduras frescas de temporada.', category: 'Verdulería', regionName: 'Valparaíso', communeName: 'Viña del Mar', phone: '+56940000010', verified: false, latitude: -33.024500, longitude: -71.551800 },
  { email: 'demo11@caserita.cl', ownerName: 'Fernanda Rojas', storeName: 'Almacén Costa Penco', description: 'Todo para el hogar y la despensa.', category: 'Almacén', regionName: 'Biobío', communeName: 'Penco', phone: '+56940000011', verified: false, latitude: -36.733300, longitude: -72.991700 },

  // ══════════════════════ JP ══════════════════════
  { email: 'demo12@caserita.cl', ownerName: 'Sebastián Núñez', storeName: 'Carnicería El Fogón', description: 'Cortes premium y para parrilla.', category: 'Carnicería', regionName: 'Biobío', communeName: 'Concepción', phone: '+56940000012', verified: false, latitude: -36.820100, longitude: -73.044400 },
  { email: 'demo13@caserita.cl', ownerName: 'Valentina Silva', storeName: 'Pastelería Mil Sabores', description: 'Kuchen y tortas para toda ocasión.', category: 'Pastelería', regionName: 'Biobío', communeName: 'Talcahuano', phone: '+56940000013', verified: true, latitude: -36.725000, longitude: -73.112600 },
  { email: 'demo14@caserita.cl', ownerName: 'Matías Fuentes', storeName: 'Botillería La Esquina', description: 'Cervezas artesanales y nacionales.', category: 'Botillería', regionName: 'Biobío', communeName: 'Coronel', phone: '+56940000014', verified: false, latitude: -37.017000, longitude: -73.146600 },
];

async function main() {
  const [adminRole, sellerRole] = await Promise.all([
    prisma.roles.findFirstOrThrow({ where: { name: 'admin' } }),
    prisma.roles.findFirstOrThrow({ where: { name: 'seller' } }),
  ]);
  const categories = await prisma.categories.findMany();
  const catByName: Record<string, bigint | undefined> = Object.fromEntries(
    categories.map((c) => [c.name, c.id]),
  );
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const t of tiendasProduccion) {
    const yaExiste = await prisma.users.findUnique({ where: { email: t.email } });
    if (yaExiste) {
      console.log(`Ya existe ${t.email} — se omite.`);
      continue;
    }

    const region = await prisma.regions.findFirstOrThrow({ where: { name: t.regionName } });
    const commune = await prisma.communes.findFirstOrThrow({
      where: { name: t.communeName, region_id: region.id },
    });

    const owner = await prisma.users.create({
      data: { email: t.email, password_hash, name: t.ownerName, phone: t.phone, email_verified: true },
    });
    await Promise.all([
      prisma.user_roles.create({ data: { user_id: owner.id, role_id: adminRole.id } }),
      prisma.user_roles.create({ data: { user_id: owner.id, role_id: sellerRole.id } }),
    ]);
    const store = await prisma.stores.create({
      data: {
        owner_id: owner.id,
        name: t.storeName,
        description: t.description,
        category_id: catByName[t.category],
        region_id: region.id,
        commune_id: commune.id,
        store_phone: t.phone,
        verified: t.verified,
        latitude: t.latitude,
        longitude: t.longitude,
      },
    });
    const templates = prodTemplates5[t.category] ?? prodTemplates5['Almacén'];
    await Promise.all(
      templates.map((p) =>
        prisma.products.create({
          data: {
            store_id: store.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            featured: p.featured ?? false,
          },
        }),
      ),
    );
    console.log(`Creada: ${t.storeName} (${t.email})`);
  }

  console.log('Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

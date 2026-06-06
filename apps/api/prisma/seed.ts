import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.categories.count();
  if (existing > 0) {
    console.log('La base ya tiene datos; se omite el seed.');
    return;
  }

  const region = await prisma.regions.create({
    data: { name: 'Región Metropolitana' },
  });

  const [santiago] = await Promise.all([
    prisma.communes.create({
      data: { name: 'Santiago', city: 'Santiago', region_id: region.id },
    }),
    prisma.communes.create({
      data: { name: 'Providencia', city: 'Santiago', region_id: region.id },
    }),
  ]);

  const categoryNames = ['Panadería', 'Verdulería', 'Almacén', 'Carnicería'];
  await Promise.all(
    categoryNames.map((name) => prisma.categories.create({ data: { name } })),
  );
  const panaderia = await prisma.categories.findFirst({
    where: { name: 'Panadería' },
  });

  await Promise.all([
    prisma.plans.create({ data: { name: 'Gratis', price: 0 } }),
    prisma.plans.create({ data: { name: 'Pro', price: 9990 } }),
  ]);

  const user = await prisma.users.create({
    data: {
      email: 'demo@caserita.cl',
      // TODO(auth): reemplazar por hash bcrypt real
      password_hash: 'demo-no-hasheado',
      name: 'Vendedor Demo',
    },
  });

  const store = await prisma.stores.create({
    data: {
      owner_id: user.id,
      name: 'Panadería La Esquina',
      description: 'Pan amasado todos los días',
      category_id: panaderia?.id,
      region_id: region.id,
      commune_id: santiago.id,
    },
  });

  await Promise.all([
    prisma.products.create({
      data: { store_id: store.id, name: 'Marraqueta', price: 1800, stock: 50 },
    }),
    prisma.products.create({
      data: { store_id: store.id, name: 'Hallulla', price: 1700, stock: 40 },
    }),
  ]);

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

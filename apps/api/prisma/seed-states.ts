import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Vacancies States
  await prisma.delivery_vacancies_states.createMany({
    data: [
      { id: 1, name: 'Abierta' },
      { id: 2, name: 'Pausada' },
      { id: 3, name: 'Cerrada' },
    ],
    skipDuplicates: true,
  });

  // Applications States
  await prisma.delivery_applications_states.createMany({
    data: [
      { id: 1, name: 'Pendiente' },
      { id: 2, name: 'Aceptada' },
      { id: 3, name: 'Rechazada' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeded delivery states successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

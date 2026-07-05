import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.users.deleteMany({
    where: {
      id: { in: [6n, 7n] }
    }
  });
  
  console.log(`Usuarios eliminados: ${result.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

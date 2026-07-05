import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const couriers = await prisma.users.findMany({
    where: {
      user_roles: {
        some: {
          roles: {
            name: 'delivery'
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  });
  
  console.log(JSON.stringify(couriers, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { prisma } from '../../config/prisma';

/**
 * Lista aplicaciones de repartidores, con filtro opcional por vacancy_id,
 * courier_id o store_id (resuelve las vacantes de la tienda antes de filtrar).
 * Lógica propia: no encaja en el CRUD genérico porque cruza store -> vacancies.
 */
export async function getAllApplications(
  params: { store_id?: string; vacancy_id?: string; courier_id?: string; page?: number; limit?: number } = {},
) {
  const page = params.page ? Number(params.page) : 1;
  const limit = params.limit ? Number(params.limit) : 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.courier_id) where.courier_id = BigInt(params.courier_id);
  if (params.vacancy_id) {
    where.vacancy_id = BigInt(params.vacancy_id);
  } else if (params.store_id) {
    const storeVacancies = await prisma.delivery_vacancies.findMany({
      where: { store_id: BigInt(params.store_id) },
      select: { id: true },
    });
    const vacancyIds = storeVacancies.map((v) => v.id);
    where.vacancy_id = { in: vacancyIds };
  }

  const [data, total] = await Promise.all([
    prisma.delivery_applications.findMany({
      where,
      skip,
      take: limit,
      orderBy: { applied_at: 'desc' },
      include: {
        users: {
          select: { name: true, email: true },
        },
        delivery_vacancies: {
          select: { 
            description: true,
            stores: {
              select: { name: true, store_phone: true }
            }
          },
        },
      },
    }),
    prisma.delivery_applications.count({ where }),
  ]);

  return { data, total, page, limit };
}

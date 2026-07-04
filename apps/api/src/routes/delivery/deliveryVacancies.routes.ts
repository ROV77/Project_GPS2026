import { prisma } from '../../config/prisma';
import { makeCrud } from '../../lib/crud';
import { crudRouter } from '../../lib/router';
import { CreateVacancySchema, UpdateVacancySchema } from '@caserita/validations';
import { getPagination, parseBigIntId } from '../../lib/http';

const crud = makeCrud(prisma.delivery_vacancies, CreateVacancySchema, UpdateVacancySchema, {
  transform: (data) => ({
    ...data,
    ...(data.store_id !== undefined ? { store_id: BigInt(data.store_id as number) } : {}),
    ...(data.state_id !== undefined
      ? { state_id: data.state_id ? BigInt(data.state_id as number) : null }
      : {}),
  }),
});

crud.list = async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const [data, total] = await Promise.all([
    prisma.delivery_vacancies.findMany({
      skip,
      take,
      orderBy: { id: 'asc' },
      include: { stores: { select: { name: true, store_phone: true, logo_url: true } } }
    }),
    prisma.delivery_vacancies.count(),
  ]);
  res.json({ data, page, limit, total });
};

crud.getById = async (req, res) => {
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const item = await prisma.delivery_vacancies.findFirst({
    where: { id },
    include: { stores: { select: { name: true, store_phone: true, logo_url: true } } }
  });
  if (!item) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(item);
};

export const deliveryVacanciesRouter = crudRouter(crud);

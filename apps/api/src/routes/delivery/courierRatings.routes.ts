import { prisma } from '../../config/prisma';
import { makeCrud } from '../../lib/crud';
import { crudRouter } from '../../lib/router';
import { CreateCourierRatingSchema, UpdateCourierRatingSchema } from '@caserita/validations';
import { Router } from 'express';
import { parseBigIntId } from '../../lib/http';

const router = Router();

// Endpoint personalizado para obtener las reseñas de un repartidor específico
router.get('/courier/:courierId', async (req, res) => {
  const courierId = parseBigIntId(req.params.courierId);
  if (!courierId) {
    res.status(400).json({ error: 'ID de repartidor inválido' });
    return;
  }

  try {
    const ratings = await prisma.courier_ratings.findMany({
      where: { courier_id: courierId },
      include: {
        stores: {
          select: { name: true, logo_url: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Transformar los BigInt a string para el JSON
    const serialized = ratings.map(r => ({
      ...r,
      id: r.id.toString(),
      courier_id: r.courier_id.toString(),
      store_id: r.store_id.toString()
    }));
    
    res.json(serialized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las reseñas' });
  }
});

const crud = makeCrud(prisma.courier_ratings, CreateCourierRatingSchema, UpdateCourierRatingSchema, {
  transform: (data) => ({
    ...data,
    ...(data.courier_id !== undefined ? { courier_id: BigInt(data.courier_id as number) } : {}),
    ...(data.store_id !== undefined ? { store_id: BigInt(data.store_id as number) } : {}),
  }),
});

const crudR = crudRouter(crud);
router.use('/', crudR);

export const courierRatingsRouter = router;

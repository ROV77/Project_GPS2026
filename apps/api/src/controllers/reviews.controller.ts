import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { parseBigIntId } from '../lib/http';
import type { CreateReviewInput } from '@caserita/validations';

/**
 * GET /api/stores/:id/reviews
 * Retorna las reseñas de una tienda con paginación.
 */
export const getStoreReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = parseBigIntId(String(req.params.id));
    if (storeId === null) {
      res.status(400).json({ error: 'ID de tienda inválido' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit)) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where: { store_id: storeId },
        include: {
          users: {
            select: {
              name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reviews.count({ where: { store_id: storeId } }),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id.toString(),
      store_id: r.store_id.toString(),
      customer_id: r.customer_id.toString(),
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at.toISOString(),
      user: {
        name: r.users.name,
        avatar_url: r.users.avatar_url,
      },
    }));

    res.json({
      data: formattedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/stores/:id/reviews
 * Crea o actualiza una reseña del usuario autenticado para la tienda.
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = parseBigIntId(String(req.params.id));
    if (storeId === null) {
      res.status(400).json({ error: 'ID de tienda inválido' });
      return;
    }

    const customerIdString = res.locals.user?.id;
    if (!customerIdString) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const customerId = BigInt(customerIdString);

    const storeExists = await prisma.stores.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const input = res.locals.body as CreateReviewInput;

    const review = await prisma.reviews.upsert({
      where: {
        store_id_customer_id: {
          store_id: storeId,
          customer_id: customerId,
        },
      },
      update: {
        rating: input.rating,
        comment: input.comment ?? null,
        created_at: new Date(), // Actualiza la fecha para que suba arriba
      },
      create: {
        store_id: storeId,
        customer_id: customerId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      include: {
        users: {
          select: {
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    res.json({
      id: review.id.toString(),
      store_id: review.store_id.toString(),
      customer_id: review.customer_id.toString(),
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at.toISOString(),
      user: {
        name: review.users.name,
        avatar_url: review.users.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

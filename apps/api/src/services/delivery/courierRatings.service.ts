import { prisma } from '../../config/prisma';
import type { CreateCourierRatingInput } from '@caserita/validations';

export const courierRatingsService = {
  async getAllRatings(params: { store_id?: string; courier_id?: string; page?: number; limit?: number } = {}) {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.store_id) where.store_id = BigInt(params.store_id);
    if (params.courier_id) where.courier_id = BigInt(params.courier_id);

    const [data, total] = await Promise.all([
      prisma.courier_ratings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: { name: true }
          }
        }
      }),
      prisma.courier_ratings.count({ where })
    ]);

    return { data, total, page, limit };
  },
  async getRatingById(id: string) {
    return prisma.courier_ratings.findUnique({ where: { id: BigInt(id) } });
  },
  async createRating(input: CreateCourierRatingInput) {
    return prisma.courier_ratings.create({
      data: {
        courier_id: BigInt(input.courier_id),
        store_id: BigInt(input.store_id),
        stars: input.stars,
        comment: input.comment,
      },
    });
  },
  async updateRating(id: string, input: Partial<CreateCourierRatingInput>) {
    const data: any = {};
    if (input.courier_id !== undefined) data.courier_id = BigInt(input.courier_id);
    if (input.store_id !== undefined) data.store_id = BigInt(input.store_id);
    if (input.stars !== undefined) data.stars = input.stars;
    if (input.comment !== undefined) data.comment = input.comment;
    return prisma.courier_ratings.update({ where: { id: BigInt(id) }, data });
  },
  async deleteRating(id: string) {
    return prisma.courier_ratings.delete({ where: { id: BigInt(id) } });
  },
};

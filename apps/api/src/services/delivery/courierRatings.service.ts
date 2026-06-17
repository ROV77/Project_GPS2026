import { prisma } from '../../config/prisma';
import type { CreateCourierRatingInput } from '@caserita/shared-types';

export class CourierRatingsService {
  async getAllRatings() {
    return prisma.courier_ratings.findMany({ orderBy: { created_at: 'desc' } });
  }
  async getRatingById(id: string) {
    return prisma.courier_ratings.findUnique({ where: { id: BigInt(id) } });
  }
  async createRating(input: CreateCourierRatingInput) {
    return prisma.courier_ratings.create({
      data: {
        courier_id: BigInt(input.courier_id),
        store_id: BigInt(input.store_id),
        stars: input.stars,
        comment: input.comment,
      },
    });
  }
  async updateRating(id: string, input: Partial<CreateCourierRatingInput>) {
    const data: any = {};
    if (input.courier_id !== undefined) data.courier_id = BigInt(input.courier_id);
    if (input.store_id !== undefined) data.store_id = BigInt(input.store_id);
    if (input.stars !== undefined) data.stars = input.stars;
    if (input.comment !== undefined) data.comment = input.comment;
    return prisma.courier_ratings.update({ where: { id: BigInt(id) }, data });
  }
  async deleteRating(id: string) {
    return prisma.courier_ratings.delete({ where: { id: BigInt(id) } });
  }
}
export const courierRatingsService = new CourierRatingsService();

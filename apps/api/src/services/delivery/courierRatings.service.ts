import { courierRatingsRepository } from '../../repositories/delivery/courierRatings.repository';
import type { CreateCourierRatingInput } from '@caserita/shared-types';

export class CourierRatingsService {
  async getAllRatings() {
    return courierRatingsRepository.findAll();
  }
  async getRatingById(id: string) {
    return courierRatingsRepository.findById(BigInt(id));
  }
  async createRating(input: CreateCourierRatingInput) {
    return courierRatingsRepository.create({
      courier_id: BigInt(input.courier_id),
      store_id: BigInt(input.store_id),
      stars: input.stars,
      comment: input.comment,
    });
  }
  async updateRating(id: string, input: Partial<CreateCourierRatingInput>) {
    const data: any = {};
    if (input.courier_id !== undefined) data.courier_id = BigInt(input.courier_id);
    if (input.store_id !== undefined) data.store_id = BigInt(input.store_id);
    if (input.stars !== undefined) data.stars = input.stars;
    if (input.comment !== undefined) data.comment = input.comment;
    return courierRatingsRepository.update(BigInt(id), data);
  }
  async deleteRating(id: string) {
    return courierRatingsRepository.delete(BigInt(id));
  }
}
export const courierRatingsService = new CourierRatingsService();

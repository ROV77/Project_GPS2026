import { deliveryVacanciesRepository } from '../../repositories/delivery/deliveryVacancies.repository';
import type { CreateVacancyInput } from '@caserita/shared-types';

export class DeliveryVacanciesService {
  async getAllVacancies() {
    return deliveryVacanciesRepository.findAll();
  }
  async getVacancyById(id: string) {
    return deliveryVacanciesRepository.findById(BigInt(id));
  }
  async createVacancy(input: CreateVacancyInput) {
    return deliveryVacanciesRepository.create({
      store_id: BigInt(input.store_id),
      description: input.description,
      state_id: input.state_id ? BigInt(input.state_id) : null,
    });
  }
  async updateVacancy(id: string, input: Partial<CreateVacancyInput>) {
    const data: any = {};
    if (input.store_id !== undefined) data.store_id = BigInt(input.store_id);
    if (input.description !== undefined) data.description = input.description;
    if (input.state_id !== undefined) data.state_id = input.state_id ? BigInt(input.state_id) : null;
    return deliveryVacanciesRepository.update(BigInt(id), data);
  }
  async deleteVacancy(id: string) {
    return deliveryVacanciesRepository.delete(BigInt(id));
  }
}
export const deliveryVacanciesService = new DeliveryVacanciesService();

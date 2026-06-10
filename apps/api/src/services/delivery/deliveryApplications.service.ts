import { deliveryApplicationsRepository } from '../../repositories/delivery/deliveryApplications.repository';
import type { CreateApplicationInput } from '@caserita/shared-types';

export class DeliveryApplicationsService {
  async getAllApplications() {
    return deliveryApplicationsRepository.findAll();
  }
  async getApplicationById(id: string) {
    return deliveryApplicationsRepository.findById(BigInt(id));
  }
  async createApplication(input: CreateApplicationInput) {
    return deliveryApplicationsRepository.create({
      vacancy_id: BigInt(input.vacancy_id),
      courier_id: BigInt(input.courier_id),
      state_id: input.state_id ? BigInt(input.state_id) : null,
    });
  }
  async updateApplication(id: string, input: Partial<CreateApplicationInput>) {
    const data: any = {};
    if (input.vacancy_id !== undefined) data.vacancy_id = BigInt(input.vacancy_id);
    if (input.courier_id !== undefined) data.courier_id = BigInt(input.courier_id);
    if (input.state_id !== undefined) data.state_id = input.state_id ? BigInt(input.state_id) : null;
    return deliveryApplicationsRepository.update(BigInt(id), data);
  }
  async deleteApplication(id: string) {
    return deliveryApplicationsRepository.delete(BigInt(id));
  }
}
export const deliveryApplicationsService = new DeliveryApplicationsService();

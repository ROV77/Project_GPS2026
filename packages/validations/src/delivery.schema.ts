import { z } from 'zod';

export const CreateVacancySchema = z.object({
  store_id: z.coerce.number().int().positive('El ID de la tienda es obligatorio y debe ser positivo'),
  description: z.string().optional(),
  state_id: z.coerce.number().int().positive().optional(),
});

export const UpdateVacancySchema = CreateVacancySchema.partial();

export const CreateApplicationSchema = z.object({
  vacancy_id: z.coerce.number().int().positive('El ID de la vacante es obligatorio'),
  courier_id: z.coerce.number().int().positive('El ID del repartidor es obligatorio'),
  state_id: z.coerce.number().int().positive().optional(),
});

export const UpdateApplicationSchema = CreateApplicationSchema.partial();

export const CreateCourierRatingSchema = z.object({
  courier_id: z.coerce.number().int().positive('El ID del repartidor es obligatorio'),
  store_id: z.coerce.number().int().positive('El ID de la tienda es obligatorio'),
  stars: z.coerce.number().int().min(1).max(5, 'La calificación debe estar entre 1 y 5 estrellas'),
  comment: z.string().optional(),
});

export const UpdateCourierRatingSchema = CreateCourierRatingSchema.partial();

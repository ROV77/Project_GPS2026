import { z } from 'zod';

/** Validador reutilizable para IDs positivos que llegan como query string */
const positiveId = z
  .string()
  .regex(/^\d+$/, 'Debe ser un número entero positivo')
  .transform(Number)
  .optional();

/**
 * Esquema Zod para los query params del endpoint GET /api/stores/search.
 *
 * Los query params llegan como strings desde HTTP, por eso todos usan
 * `.transform(Number)`. Este esquema es reutilizable en el frontend web
 * (React Hook Form) vía `@caserita/validations`.
 */
export const StoreFiltersSchema = z.object({
  region_id: positiveId,
  commune_id: positiveId,
  category_id: positiveId,
  verified_only: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .default('false'),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional()
    .default('20'),
});

export type StoreFiltersInput = z.input<typeof StoreFiltersSchema>;
export type StoreFiltersOutput = z.output<typeof StoreFiltersSchema>;

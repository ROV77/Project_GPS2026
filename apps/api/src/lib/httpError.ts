/**
 * Error con código HTTP explícito. Lo lanzan los services/controllers cuando
 * quieren una respuesta concreta (401, 403, 404...) y el `errorHandler` la
 * traduce. Para errores de dominio que no son de Zod ni de Prisma.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

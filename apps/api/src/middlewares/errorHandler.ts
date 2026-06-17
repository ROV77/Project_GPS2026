import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', issues: err.flatten().fieldErrors });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        res.status(404).json({ error: 'No encontrado' });
        return;
      case 'P2002':
        res.status(409).json({ error: 'Valor duplicado: viola una restricción única' });
        return;
      case 'P2003':
        res.status(409).json({ error: 'Referencia inválida: viola una llave foránea' });
        return;
    }
  }

  console.error(err);
  // En producción no se filtran detalles internos ni el stack al cliente.
  const isDev = env.NODE_ENV !== 'production';
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(isDev && {
      details: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}

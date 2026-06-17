import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().optional(),
  phone: z.string().max(20).optional(),
  avatar_url: z.string().url().optional(),
});
const updateUserSchema = createUserSchema.partial();

const crud = makeCrud(prisma.users, createUserSchema, updateUserSchema, {
  softDelete: true,
  transform: (data) => {
    const { password, ...rest } = data as { password?: string };
    if (password === undefined) return rest;
    // Se hashea con bcrypt antes de persistir (mismo algoritmo que el login).
    return { ...rest, password_hash: bcrypt.hashSync(password, 10) };
  },
});

export const usersRouter = crudRouter(crud);

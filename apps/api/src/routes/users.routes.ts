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
  avatar_url: z.union([z.string().url(), z.literal('')]).optional(),
});
const updateUserSchema = createUserSchema.partial();

const crud = makeCrud(prisma.users, createUserSchema, updateUserSchema, {
  softDelete: true,
  transform: (data) => {
    const { password, ...rest } = data as { password?: string; avatar_url?: string };
    const out = { ...rest } as Record<string, unknown>;
    if (out.avatar_url === '') out.avatar_url = null;
    if (password === undefined) return out;
    return { ...out, password_hash: bcrypt.hashSync(password, 10) };
  },
});

export const usersRouter = crudRouter(crud);

import type { Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { parseBigIntId, getPagination } from './http';

interface PrismaDelegate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args?: any) => Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findFirst: (args?: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count: (args?: any) => Promise<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (args: any) => Promise<any>;
}

interface CrudOptions {
  softDelete?: boolean;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export function makeCrud(
  delegate: PrismaDelegate,
  createSchema: ZodSchema,
  updateSchema: ZodSchema,
  opts: CrudOptions = {},
) {
  const baseWhere: Record<string, unknown> = opts.softDelete
    ? { deleted_at: null }
    : {};
  const transform = opts.transform ?? ((data) => data);

  return {
    async list(req: Request, res: Response): Promise<void> {
      const { skip, take, page, limit } = getPagination(req.query);
      const [data, total] = await Promise.all([
        delegate.findMany({ where: baseWhere, skip, take, orderBy: { id: 'asc' } }),
        delegate.count({ where: baseWhere }),
      ]);
      res.json({ data, page, limit, total });
    },

    async getById(req: Request, res: Response): Promise<void> {
      const id = parseBigIntId(String(req.params.id));
      if (id === null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      const item = await delegate.findFirst({ where: { id, ...baseWhere } });
      if (!item) {
        res.status(404).json({ error: 'No encontrado' });
        return;
      }
      res.json(item);
    },

    async create(req: Request, res: Response): Promise<void> {
      const data = createSchema.parse(req.body);
      const created = await delegate.create({ data: transform(data) });
      res.status(201).json(created);
    },

    async update(req: Request, res: Response): Promise<void> {
      const id = parseBigIntId(String(req.params.id));
      if (id === null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      const data = updateSchema.parse(req.body);
      const updated = await delegate.update({
        where: { id },
        data: transform(data),
      });
      res.json(updated);
    },

    async remove(req: Request, res: Response): Promise<void> {
      const id = parseBigIntId(String(req.params.id));
      if (id === null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      if (opts.softDelete) {
        await delegate.update({
          where: { id },
          data: { deleted_at: new Date() },
        });
      } else {
        await delegate.delete({ where: { id } });
      }
      res.status(204).send();
    },
  };
}

export type Crud = ReturnType<typeof makeCrud>;

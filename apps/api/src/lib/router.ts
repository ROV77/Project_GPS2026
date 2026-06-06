import { Router } from 'express';
import type { Crud } from './crud';

export function crudRouter(crud: Crud): Router {
  const router = Router();
  router.get('/', crud.list);
  router.get('/:id', crud.getById);
  router.post('/', crud.create);
  router.put('/:id', crud.update);
  router.delete('/:id', crud.remove);
  return router;
}

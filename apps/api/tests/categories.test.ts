import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/categories', () => {
  it('responde 200 con la forma { data, page, limit, total }', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('total');
  });
});

describe('POST /api/categories', () => {
  it('rechaza un body inválido con 400', async () => {
    const res = await request(app).post('/api/categories').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('crea una categoría válida con 201', async () => {
    const name = `Test-${Date.now()}`;
    const res = await request(app).post('/api/categories').send({ name });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(name);

    await prisma.categories.delete({ where: { id: BigInt(res.body.id) } });
  });
});

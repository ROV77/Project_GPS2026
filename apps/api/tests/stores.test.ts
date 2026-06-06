import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/stores', () => {
  it('responde 200 con un arreglo en data', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('responde 404 para un id inexistente', async () => {
    const res = await request(app).get('/api/stores/99999999');
    expect(res.status).toBe(404);
  });

  it('responde 400 para un id no numérico', async () => {
    const res = await request(app).get('/api/stores/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/stores', () => {
  it('rechaza un body inválido con 400', async () => {
    const res = await request(app).post('/api/stores').send({ name: 'Sin dueño' });
    expect(res.status).toBe(400);
  });

  it('responde 409 cuando la llave foránea no existe', async () => {
    const res = await request(app)
      .post('/api/stores')
      .send({ owner_id: 99999999, name: 'Tienda Fantasma' });
    expect(res.status).toBe(409);
  });
});

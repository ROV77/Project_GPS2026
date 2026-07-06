/**
 * Herramienta de desarrollo: pone la tienda de un vendedor en un plan, creando
 * una suscripción activa por un mes (sin pasar por el pago de MercadoPago). Sirve
 * para probar el gating por plan (estadísticas, promociones) en local.
 *
 * Uso:  tsx set-plan.ts <email-del-vendedor> [NombrePlan=Pro]
 * Ej.:  tsx set-plan.ts demo@caserita.cl Pro
 */
import { prisma } from './src/config/prisma';

async function main() {
  const [email, planName = 'Pro'] = process.argv.slice(2);
  if (!email) {
    console.error('Uso: tsx set-plan.ts <email-del-vendedor> [NombrePlan=Pro]');
    process.exit(1);
  }

  const user = await prisma.users.findFirst({ where: { email } });
  if (!user) throw new Error(`Usuario no encontrado: ${email}`);

  const store = await prisma.stores.findFirst({
    where: { owner_id: user.id },
    orderBy: { id: 'asc' },
  });
  if (!store) throw new Error(`El usuario ${email} no tiene tienda`);

  const plan = await prisma.plans.findFirst({ where: { name: planName } });
  if (!plan) throw new Error(`Plan no encontrado: ${planName}`);

  const [activeState, canceledState] = await Promise.all([
    prisma.subscriptions_states.findFirst({ where: { name: 'active' } }),
    prisma.subscriptions_states.findFirst({ where: { name: 'canceled' } }),
  ]);
  if (!activeState || !canceledState) {
    throw new Error('Faltan estados de suscripción; corre el seed.');
  }

  // Cierra cualquier suscripción activa previa (no dejar dos activas).
  await prisma.subscriptions.updateMany({
    where: { store_id: store.id, state_id: activeState.id },
    data: { state_id: canceledState.id },
  });

  // El plan Gratis es implícito (no se crea fila); cualquier pago crea la activa.
  if (Number(plan.price) > 0) {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await prisma.subscriptions.create({
      data: {
        store_id: store.id,
        plan_id: plan.id,
        state_id: activeState.id,
        starts_at: now,
        expires_at: expiresAt,
      },
    });
  }

  console.log(`✔ ${email} → tienda "${store.name}" ahora en plan ${plan.name}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

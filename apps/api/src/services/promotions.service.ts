import type { CreatePromotionInput, UpdatePromotionInput } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { HttpError } from '../lib/httpError';
import { notificationsService } from './notifications.service';

/** Campos del producto que acompañan a cada promoción en las respuestas. */
const productSelect = { id: true, name: true, price: true, image_url: true } as const;

/** Texto legible del beneficio, según el tipo de promoción. */
function promoOffer(discountType: string, discountValue: number | null): string {
  if (discountType === 'percentage' && discountValue != null) {
    return `${discountValue}% de descuento`;
  }
  return discountType; // '2x1' | '3x2'
}

/**
 * Avisa (buzón in-app) a los usuarios que tienen la tienda como favorita que hay
 * una nueva promoción. Es "fire-and-forget": cualquier error se registra pero NO
 * interrumpe la creación de la promoción (el aviso es secundario).
 */
async function notifyFavoritesOfPromotion(
  storeId: bigint,
  promotion: { id: bigint; discount_type: string; discount_value: unknown; products: { name: string } },
): Promise<void> {
  try {
    const store = await prisma.stores.findUnique({
      where: { id: storeId },
      select: { name: true },
    });
    const storeName = store?.name ?? 'Una tienda';
    const value = promotion.discount_value != null ? Number(promotion.discount_value) : null;
    const offer = promoOffer(promotion.discount_type, value);

    await notificationsService.notifyStoreFavorites(storeId, {
      title: `Nueva promoción en ${storeName}`,
      body: `${promotion.products.name}: ${offer}`,
      type: 'promotion',
      metadata: {
        store_id: storeId.toString(),
        promotion_id: promotion.id.toString(),
      },
    });
  } catch (err) {
    console.error('[promotions] fallo al avisar a favoritos:', err);
  }
}

/** Verifica que el producto exista y sea de la tienda; devuelve su id. */
async function assertOwnedProduct(storeId: bigint, productId: number): Promise<bigint> {
  const product = await prisma.products.findFirst({
    where: { id: BigInt(productId), store_id: storeId, deleted_at: null },
    select: { id: true },
  });
  if (!product) throw new HttpError(400, 'El producto no pertenece a tu tienda');
  return product.id;
}

/**
 * Regla de negocio: un producto solo puede tener UNA promoción activa a la vez.
 * Rechaza si ya existe otra activa sobre el mismo producto (excluye `exceptId`
 * al editar). El seller debe pausar o eliminar la anterior primero.
 */
async function assertNoActiveConflict(productId: bigint, exceptId?: bigint): Promise<void> {
  const existing = await prisma.promotions.findFirst({
    where: {
      product_id: productId,
      is_active: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(
      409,
      'Este producto ya tiene una promoción activa. Pausa o elimina la anterior.',
    );
  }
}

/** Solo el tipo 'percentage' guarda un valor numérico; las promos por cantidad no. */
function normalizeValue(type: string, value: number | null | undefined): number | null {
  return type === 'percentage' ? value ?? null : null;
}

export const promotionsService = {
  /** Todas las promociones de la tienda con su producto. Activas primero. */
  async list(storeId: bigint) {
    return prisma.promotions.findMany({
      where: { store_id: storeId },
      orderBy: [{ is_active: 'desc' }, { id: 'desc' }],
      include: { products: { select: productSelect } },
    });
  },

  async create(storeId: bigint, input: CreatePromotionInput) {
    const productId = await assertOwnedProduct(storeId, input.product_id);
    const isActive = input.is_active ?? true;
    if (isActive) await assertNoActiveConflict(productId);

    const promo = await prisma.promotions.create({
      data: {
        store_id: storeId,
        product_id: productId,
        discount_type: input.discount_type,
        discount_value: normalizeValue(input.discount_type, input.discount_value),
        is_active: isActive,
        valid_from: input.valid_from ?? null,
        valid_until: input.valid_until ?? null,
      },
      include: { products: { select: productSelect } },
    });

    // Solo una promo activa genera avisos (una pausada no molesta a nadie).
    if (promo.is_active) await notifyFavoritesOfPromotion(storeId, promo);

    return promo;
  },

  async update(storeId: bigint, id: bigint, input: UpdatePromotionInput) {
    const current = await prisma.promotions.findFirst({ where: { id, store_id: storeId } });
    if (!current) throw new HttpError(404, 'Promoción no encontrada');

    const productId =
      input.product_id !== undefined
        ? await assertOwnedProduct(storeId, input.product_id)
        : current.product_id;

    const discountType = input.discount_type ?? current.discount_type;
    const isActive = input.is_active ?? current.is_active;

    // Si la promoción queda activa, respetar "una activa por producto".
    if (isActive) await assertNoActiveConflict(productId, id);

    const currentValue = current.discount_value != null ? Number(current.discount_value) : undefined;
    const discountValue = normalizeValue(discountType, input.discount_value ?? currentValue);

    return prisma.promotions.update({
      where: { id },
      data: {
        product_id: productId,
        discount_type: discountType,
        discount_value: discountValue,
        is_active: isActive,
        ...(input.valid_from !== undefined ? { valid_from: input.valid_from ?? null } : {}),
        ...(input.valid_until !== undefined ? { valid_until: input.valid_until ?? null } : {}),
      },
      include: { products: { select: productSelect } },
    });
  },

  async remove(storeId: bigint, id: bigint) {
    const found = await prisma.promotions.findFirst({
      where: { id, store_id: storeId },
      select: { id: true },
    });
    if (!found) throw new HttpError(404, 'Promoción no encontrada');
    await prisma.promotions.delete({ where: { id } });
  },
};

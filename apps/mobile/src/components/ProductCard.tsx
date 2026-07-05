/**
 * Tarjeta de producto para el catálogo del detalle de tienda. Foto (RemoteImage)
 * + nombre + descripción + precio (CLP). Badge "Destacado" si `featured`. Incluye
 * el control de carrito: botón "Agregar" o `QuantityStepper` según la cantidad ya
 * en el carrito. Solo lectura de datos (el mobile nunca edita el producto).
 */
import { View, Pressable, Alert } from 'react-native';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { RemoteImage } from '@/ui/RemoteImage';
import { QuantityStepper } from '@/ui/QuantityStepper';
import { formatCLP } from '@/shared/lib/format';
import { useCart } from '@/features/cart/cart.store';
import type { Product, Store } from '@/features/stores/types';

export function ProductCard({ product, store }: { product: Product; store: Store }) {
  const soldOut = product.stock <= 0;
  // La qty solo cuenta si el carrito es de ESTA tienda (carrito de una a la vez).
  const qty = useCart((s) => (s.storeId === store.id ? s.items[product.id]?.qty ?? 0 : 0));
  const addItem = useCart((s) => s.addItem);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);

  const handleAdd = () => {
    const { storeId, storeName, items } = useCart.getState();
    const otherStoreHasItems =
      storeId && storeId !== store.id && Object.keys(items).length > 0;
    if (otherStoreHasItems) {
      Alert.alert(
        'Nuevo pedido',
        `Tienes un pedido en ${storeName}. ¿Vaciarlo para pedir en ${store.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Vaciar y agregar',
            style: 'destructive',
            onPress: () => addItem(store, product),
          },
        ],
      );
      return;
    }
    addItem(store, product);
  };

  return (
    <Card className="flex-row items-center gap-3">
      <RemoteImage uri={product.image_url} size={64} rounded={12} />

      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text variant="subtitle" numberOfLines={1} className="flex-shrink">
            {product.name}
          </Text>
          {product.featured ? (
            <View className="rounded-full bg-brand-50 px-2 py-0.5">
              <Text variant="caption" className="text-brand-700">
                Destacado
              </Text>
            </View>
          ) : null}
        </View>

        {product.description ? (
          <Text variant="label" numberOfLines={2} className="mt-0.5">
            {product.description}
          </Text>
        ) : null}

        <View className="mt-1 flex-row items-center justify-between">
          <Text variant="subtitle" className="text-foreground">
            {formatCLP(product.price)}
          </Text>

          {soldOut ? (
            <Text variant="caption" className="text-destructive">
              Agotado
            </Text>
          ) : qty > 0 ? (
            <QuantityStepper
              qty={qty}
              onDecrement={() => decrement(product.id)}
              onIncrement={() => increment(product.id)}
            />
          ) : (
            <Pressable
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${product.name} al pedido`}
              className="rounded-full bg-brand-700 px-4 py-1.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Text variant="label" className="text-white">
                Agregar
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}

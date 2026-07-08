/**
 * Bottom sheet de revisión del pedido. Modelado en StoreDetailSheet (mismo
 * BottomSheet inline + backdrop). Lista los items del carrito con QuantityStepper,
 * muestra el total y arma el mensaje de WhatsApp con el pedido.
 *
 * Lee el carrito global (useCart), acotado a la tienda actual: si el carrito
 * pertenece a otra tienda, se muestra vacío (no debería ocurrir estando en su
 * detalle, pero mantiene la invariante "carrito de una tienda a la vez").
 */
import { forwardRef, useCallback, useMemo } from 'react';
import { View, Linking, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Trash2 } from 'lucide-react-native';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { RemoteImage } from '@/ui/RemoteImage';
import { QuantityStepper } from '@/ui/QuantityStepper';
import { useThemeColors } from '@/ui/theme';
import { formatCLP } from '@/shared/lib/format';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import { useCart, cartTotal } from '@/features/cart/cart.store';
import { buildOrderMessage } from '@/features/cart/message';
import type { Store } from '@/features/stores/types';

export const CartSheet = forwardRef<BottomSheet, { store: Store }>(function CartSheet(
  { store },
  ref,
) {
  const colors = useThemeColors();
  const active = useCart((s) => s.storeId === store.id);
  const items = useCart((s) => s.items);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const clear = useCart((s) => s.clear);

  const snapPoints = useMemo(() => ['50%', '85%'], []);
  const list = active ? Object.values(items) : [];
  const total = active ? cartTotal(items) : 0;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    [],
  );

  const sendOrder = () => {
    const url = buildWhatsAppUrl(store.store_phone, buildOrderMessage(store.name, list));
    if (url) void Linking.openURL(url);
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
        <Text variant="heading">Tu pedido</Text>

        {list.length === 0 ? (
          <Text variant="caption">Tu carrito está vacío.</Text>
        ) : (
          <>
            {list.map((it) => (
              <View key={it.product.id} className="flex-row items-center gap-3">
                <RemoteImage uri={it.product.image_url} size={48} rounded={10} />
                <View className="flex-1">
                  <Text variant="body" numberOfLines={1} className="text-foreground">
                    {it.product.name}
                  </Text>
                  <Text variant="caption">
                    {formatCLP(it.product.price)} c/u · {formatCLP(it.qty * Number(it.product.price))}
                  </Text>
                </View>
                <QuantityStepper
                  qty={it.qty}
                  maxQty={it.product.stock}
                  onDecrement={() => decrement(it.product.id)}
                  onIncrement={() => increment(it.product.id)}
                />
              </View>
            ))}

            <View className="mt-1 flex-row items-center justify-between border-t border-border pt-3">
              <Text variant="subtitle">Total</Text>
              <Text variant="subtitle">{formatCLP(total)}</Text>
            </View>

            <Button label="Pedir por WhatsApp" onPress={sendOrder} />

            <Pressable
              onPress={clear}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Vaciar pedido"
              className="flex-row items-center justify-center gap-1.5 py-2"
            >
              <Trash2 size={15} color={colors.destructive} strokeWidth={2} />
              <Text variant="label" style={{ color: colors.destructive }}>
                Vaciar pedido
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

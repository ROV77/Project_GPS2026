/**
 * Panel de revisión del pedido. Modal nativo (no bottom-sheet de gorhom): así no
 * renderiza nada hasta `open`, evitando que se asome vacío al entrar a la tienda.
 * Lista los items del carrito con QuantityStepper, muestra el total y arma el
 * mensaje de WhatsApp con el pedido.
 *
 * Lee el carrito global (useCart), acotado a la tienda actual: si el carrito
 * pertenece a otra tienda, se muestra vacío (no debería ocurrir estando en su
 * detalle, pero mantiene la invariante "carrito de una tienda a la vez").
 */
import { View, Linking, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export function CartSheet({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store: Store;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const active = useCart((s) => s.storeId === store.id);
  const items = useCart((s) => s.items);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const clear = useCart((s) => s.clear);

  const list = active ? Object.values(items) : [];
  const total = active ? cartTotal(items) : 0;

  const sendOrder = () => {
    const url = buildWhatsAppUrl(store.store_phone, buildOrderMessage(store.name, list));
    if (url) void Linking.openURL(url);
  };

  const handleClear = () => {
    clear();
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar pedido"
        />
        <View
          className="max-h-[85%] rounded-t-3xl bg-card"
          style={{ paddingBottom: insets.bottom || 16 }}
        >
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-muted" />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
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
                  onPress={handleClear}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

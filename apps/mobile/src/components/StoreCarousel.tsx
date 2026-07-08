import { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, type ViewToken } from 'react-native';
import type { ReactNode } from 'react';
import { StoreCard } from './StoreCard';
import { Text } from '@/ui/Text';
import type { Store } from '@/features/stores/types';
import { useRouter } from 'expo-router';
import { runOnJS, runOnUI, scrollTo, useAnimatedRef, useSharedValue } from 'react-native-reanimated';

interface StoreCarouselProps {
  title: string;
  icon?: ReactNode;
  stores: Store[];
  autoScroll?: boolean;
}

export function StoreCarousel({ title, icon, stores, autoScroll = false }: StoreCarouselProps) {
  const router = useRouter();
  const listRef = useAnimatedRef<FlatList<Store>>();
  const [isInteracting, setIsInteracting] = useState(false);
  const scrollOffset = useSharedValue(0);
  const maxScroll = useSharedValue(0);
  
  // Basic auto-scroll implementation using JS timer (or RAF) for simplicity and reliability in plain RN.
  useEffect(() => {
    if (!autoScroll || stores.length === 0 || isInteracting) return;

    let animationFrameId: number;
    let lastTime = Date.now();
    
    // Pixels per millisecond (adjust for speed)
    const speed = 0.04;

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      scrollOffset.value += delta * speed;
      
      // If we reach the end, reset to start or reverse
      // For an infinite effect, we'd need to loop the data.
      // Here we just stop at the end or smoothly reset.
      if (maxScroll.value > 0 && scrollOffset.value > maxScroll.value) {
        scrollOffset.value = 0;
      }

      // We must call scrollTo on the UI thread, or just use JS if not intensive
      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: scrollOffset.value, animated: false });
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [autoScroll, stores.length, isInteracting, listRef, scrollOffset, maxScroll]);

  if (stores.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="px-5 mb-3 flex-row items-center gap-2">
        {icon}
        <Text variant="subtitle" className="text-lg font-bold">{title}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        snapToInterval={220} // assuming card width is roughly 220 + 8 margin
        decelerationRate="fast"
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
        onScrollBeginDrag={() => setIsInteracting(true)}
        onScrollEndDrag={() => setIsInteracting(false)}
        onContentSizeChange={(w, h) => {
          maxScroll.value = w; // Approximate, actual max offset is w - screenWidth
        }}
        renderItem={({ item }) => (
          <View className="w-[220px] px-2">
            <StoreCard
              store={item}
              onPress={() =>
                router.push({
                  pathname: '/(public)/store/[id]',
                  params: { id: item.id, store: JSON.stringify(item) },
                })
              }
            />
          </View>
        )}
      />
    </View>
  );
}

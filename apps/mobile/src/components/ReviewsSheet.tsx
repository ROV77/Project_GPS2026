import React, { useMemo, useState } from 'react';
import { View, FlatList, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Star } from 'lucide-react-native';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Avatar } from '@/ui/Avatar';
import { useThemeColors } from '@/ui/theme';
import { useReviews } from '@/features/reviews/useReviews';
import { useSession } from '@/features/auth/session.store';
import { useRouter } from 'expo-router';

interface ReviewsSheetProps {
  storeId: string;
}

export const ReviewsSheet = React.forwardRef<BottomSheet, ReviewsSheetProps>(({ storeId }, ref) => {
  const colors = useThemeColors();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const { reviews, loading, submitReview } = useReviews(storeId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const handleRatingSubmit = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({ rating, comment });
      setComment('');
      // Mantener las estrellas para que el usuario sepa que funcionó, o reset a 5
    } catch (err) {
      console.error(err);
      alert('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, size = 16, onPress?: (star: number) => void) => (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onPress?.(star)} disabled={!onPress}>
          <Star
            size={size}
            color={star <= currentRating ? colors.amber : colors.muted}
            fill={star <= currentRating ? colors.amber : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="px-5 pb-4 border-b border-border">
          <Text variant="title">Reseñas</Text>
        </View>

        {status === 'authenticated' ? (
          <View className="p-5 border-b border-border bg-card">
            <Text variant="body" className="text-muted-foreground mb-2">¿Cómo calificarías tu experiencia?</Text>
            {renderStars(rating, 24, setRating)}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Escribe tu opinión (opcional)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="mt-4 p-3 rounded-xl border border-border bg-background min-h-[80px]"
              style={{ color: colors.foreground, textAlignVertical: 'top' }}
            />
            <View className="mt-4">
              <Button
                label={submitting ? 'Enviando...' : 'Publicar reseña'}
                onPress={handleRatingSubmit}
                loading={submitting}
              />
            </View>
          </View>
        ) : (
          <View className="p-5 border-b border-border bg-card items-center">
            <Text variant="body" className="text-muted-foreground text-center mb-3">
              Inicia sesión para poder calificar esta tienda y dejar tu opinión.
            </Text>
            <Button label="Iniciar sesión" variant="secondary" onPress={() => router.push('/login')} />
          </View>
        )}

        <BottomSheetFlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          renderItem={({ item }) => (
            <View className="p-4 rounded-2xl border border-border bg-card">
              <View className="flex-row items-center gap-3 mb-2">
                <Avatar uri={item.user.avatar_url} size={40} />
                <View className="flex-1">
                  <Text variant="body" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {item.user.name || 'Usuario'}
                  </Text>
                  {renderStars(item.rating, 14)}
                </View>
                <Text variant="label">
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              {!!item.comment && (
                <Text variant="body" className="mt-2 text-muted-foreground">
                  {item.comment}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text variant="body" className="text-muted-foreground">Aún no hay reseñas para esta tienda.</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </BottomSheet>
  );
});

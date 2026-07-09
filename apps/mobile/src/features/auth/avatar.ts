/**
 * Flujo "cambiar foto de perfil": abre la galería, deja recortar (cuadrado) y
 * comprimir con el recorte nativo de expo-image-picker, sube la imagen a
 * Cloudinary y persiste el avatar_url (PATCH /auth/me), refrescando la sesión.
 *
 * Devuelve la nueva url, o null si el usuario canceló. Lanza un Error con
 * mensaje si falta permiso o falla la subida (el caller lo muestra).
 */
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, updateMe } from './api';
import { useSession } from './session.store';

export async function pickAndUploadAvatar(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Necesitamos permiso para acceder a tus fotos.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // recorte/posicionado nativo
    aspect: [1, 1], // avatar cuadrado
    quality: 0.7, // compresión en cliente; la API limita a 256px para avatares
  });
  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const url = await uploadImage(uri, 'avatar');
  const { user, store } = await updateMe({ avatar_url: url });
  useSession.getState().setSession(user, store);
  return url;
}

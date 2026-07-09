/**
 * Wrapper de expo-secure-store para el JWT de sesión.
 *
 * Es el equivalente mobile del `localStorage` que usa el web, pero CIFRADO por
 * el sistema operativo (Keychain en iOS / Keystore en Android). Nunca guardar el
 * token en AsyncStorage (texto plano). Ver docs/AUTH-WEB-VS-MOBILE.md.
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'caserita-auth-token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

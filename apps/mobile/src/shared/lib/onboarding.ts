/**
 * Flag persistido "el usuario ya vio el onboarding".
 *
 * Reusa expo-secure-store (ya presente en el proyecto) para no añadir
 * AsyncStorage como dependencia solo por un booleano. No es dato sensible, pero
 * el almacén cifrado sirve igual y mantiene un único mecanismo de persistencia.
 */
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'caserita-onboarding-seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
}

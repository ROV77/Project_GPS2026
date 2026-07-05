/**
 * Construcción de enlaces de WhatsApp (wa.me). Convierte un teléfono en formato
 * libre (ej. "+56 9 1234 5678", "9 1234 5678") al número que espera wa.me: solo
 * dígitos, con código de país, sin "+" ni espacios.
 *
 * Normalización chilena: si tras limpiar quedan 9 dígitos que empiezan en 9
 * (móvil sin prefijo país), se antepone "56". Devuelve `null` si no hay un número
 * plausible, para que la UI oculte el botón en vez de abrir un enlace roto.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('9')) digits = `56${digits}`;
  // Un móvil chileno con código país son 11 dígitos (56 + 9 + 8). Exigimos al
  // menos 8 para no generar enlaces absurdos con teléfonos incompletos.
  return digits.length >= 8 ? digits : null;
}

/**
 * URL de WhatsApp lista para `Linking.openURL`. `wa.me` abre la app si está
 * instalada y cae a WhatsApp Web/tienda si no. Devuelve `null` si el teléfono
 * no es válido.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

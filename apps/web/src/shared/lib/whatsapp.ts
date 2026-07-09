/** Normaliza un teléfono chileno al formato que espera wa.me (solo dígitos con código país). */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('9')) digits = `56${digits}`;
  return digits.length >= 8 ? digits : null;
}

/** URL de WhatsApp lista para abrir en nueva pestaña. Devuelve null si el teléfono no es válido. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

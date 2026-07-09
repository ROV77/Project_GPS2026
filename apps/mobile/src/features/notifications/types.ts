/**
 * Tipos del dominio "notificaciones" (buzón in-app), alineados con la API:
 *   GET /api/notifications           → Notification[]
 *   GET /api/notifications/unread-count → { count }
 *
 * La API serializa los BigInt como STRING, por eso `id` es string. `metadata`
 * es JSON libre; para las promociones trae { store_id, promotion_id }.
 */
export interface NotificationMetadata {
  store_id?: string;
  promotion_id?: string;
}

export interface AppNotification {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: NotificationMetadata | null;
  created_at: string;
}

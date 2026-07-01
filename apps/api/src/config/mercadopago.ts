import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { env } from './env';
import { HttpError } from '../lib/httpError';

const isConfigured = Boolean(env.MP_ACCESS_TOKEN && env.API_PUBLIC_URL);

const client = env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN })
  : null;

function requireClient(): MercadoPagoConfig {
  if (!isConfigured || !client) {
    throw new HttpError(
      503,
      'MercadoPago no configurado: define MP_ACCESS_TOKEN y API_PUBLIC_URL en el .env',
    );
  }
  return client;
}

/**
 * Crea una Preference de Checkout Pro para un plan y devuelve la URL a la que
 * hay que redirigir al navegador para pagar. `externalReference` es el id de
 * la fila `subscriptions` pendiente: el webhook la usa para saber a qué
 * suscripción activar cuando MercadoPago confirme el pago.
 */
export async function createCheckoutPreference(params: {
  title: string;
  price: number;
  externalReference: string;
}): Promise<{ init_point: string }> {
  const preference = new Preference(requireClient());

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.externalReference,
          title: params.title,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: params.price,
        },
      ],
      external_reference: params.externalReference,
      back_urls: {
        success: `${env.WEB_PUBLIC_URL}/planes?status=success`,
        pending: `${env.WEB_PUBLIC_URL}/planes?status=pending`,
        failure: `${env.WEB_PUBLIC_URL}/planes?status=failure`,
      },
      auto_return: 'approved',
      notification_url: `${env.API_PUBLIC_URL}/api/subscriptions/webhook`,
    },
  });

  if (!result.init_point) {
    throw new HttpError(500, 'MercadoPago no devolvió una URL de pago');
  }
  return { init_point: result.init_point };
}

/**
 * Recupera un pago directo desde la API de MercadoPago por su id. El webhook
 * SIEMPRE debe usar esto en vez de confiar en el body de la notificación: la
 * notificación solo avisa "algo cambió", el estado real hay que pedirlo aquí.
 */
export async function getPayment(paymentId: string) {
  const payment = new Payment(requireClient());
  return payment.get({ id: paymentId });
}

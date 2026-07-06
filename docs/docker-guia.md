# Levantar el proyecto con Docker Desktop

## 1. Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y **corriendo** (ícono de la ballena en la bandeja del sistema, en verde/estable).
- Windows: usa el backend **WSL2** (Docker Desktop lo pide al instalar; si no, actívalo en Settings → General → "Use the WSL 2 based engine").

## 2. Configurar variables (una vez)
Copia los tres `.env.example` a `.env` reales y complétalos:

```
cp .env.example .env                          # NGROK_AUTHTOKEN, NGROK_DOMAIN
cp apps/api/.env.example apps/api/.env        # DATABASE_URL, JWT_SECRET, CLOUDINARY_*, MP_ACCESS_TOKEN, WEB_PUBLIC_URL, API_PUBLIC_URL
```
(`apps/web/.env` no aplica para Docker — el build usa el `VITE_API_URL` del `.env` de la raíz.)

Detalle de cada variable, comentado en su propio `.env.example`. El único dominio ngrok que pide el equipo (`NGROK_DOMAIN`) se comparte por el canal del proyecto — no generes uno nuevo cada uno, o el `WEB_PUBLIC_URL`/`API_PUBLIC_URL` del `.env` de la API no van a coincidir con el que corre el túnel.

## 3. Levantar el stack
Desde la raíz del repo, con Docker Desktop abierto:

```
docker compose up -d --build
```

Primera vez tarda unos minutos (instala dependencias + compila). Al terminar:

```
docker compose ps          # api, web y ngrok deben decir "Up"
docker compose logs -f api # confirma que corrieron las migraciones + el seed sin error
docker compose logs ngrok  # confirma el túnel activo (busca la línea "started tunnel")
```

Abre `https://<tu-dominio>.ngrok-free.dev` en el navegador — ahí está la app completa (front + `/api` proxeado).

## 4. Comandos del día a día
| Quiero... | Comando |
|---|---|
| Ver logs en vivo de un servicio | `docker compose logs -f api` (o `web`, `ngrok`) |
| Reiniciar todo tras cambiar código | `docker compose up -d --build` |
| Apagar todo | `docker compose down` |
| Apagar y borrar también volúmenes/caché | `docker compose down -v` |
| Entrar a una shell dentro del contenedor api | `docker compose exec api sh` |

## 5. Errores comunes
| Síntoma | Causa | Solución |
|---|---|---|
| `error during connect... pipe/dockerDesktopLinuxEngine` | Docker Desktop no está corriendo | Ábrelo y espera a que el ícono quede estable |
| `api` reinicia en loop, log dice `Prisma no pudo conectar` | `DATABASE_URL` sigue en `localhost` en vez de `host.docker.internal` | Edita `apps/api/.env` (ver comentario en el `.env.example`) |
| `503 MercadoPago no configurado` al usar `/planes` | Falta `MP_ACCESS_TOKEN` o `API_PUBLIC_URL` en `apps/api/.env` | Complétalos y `docker compose up -d --build` de nuevo |
| ngrok: `ERR_NGROK_105`/`302`/dominio no encontrado | `NGROK_AUTHTOKEN` o `NGROK_DOMAIN` mal copiados, o el dominio no es tuyo/del equipo | Revisa `dashboard.ngrok.com` → Domains / Your Authtoken |
| El navegador muestra la interstitial de ngrok en vez de la app | Normal la primera visita en el plan free — clic en "Visit Site" | — |

Más detalle del módulo de Mercado Pago (credenciales de prueba, usuario comprador de prueba, tabla de errores) en `docs/planes-y-suscripciones.md` §12.

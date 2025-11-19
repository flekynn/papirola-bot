# 📺 Papirola Bot

Bot de Discord modular para notificar streams en **Twitch**, **Kick** y **YouTube**, con comandos de prueba y chequeo forzado.  
Diseñado para ser escalable: fácil de extender con moderación, saludos personalizados y más.

---

## 🚀 Instalación y configuración

### 1. Clona el repositorio
```bash
git clone https://github.com/flekynn/papirola-bot.git
cd papirola-bot
2. Instala dependencias
bash
npm install
3. Configura tu archivo .env
Agrega las variables necesarias:

env
DISCORD_TOKEN=tu_token_discord
STREAM_CHANNEL_ID=id_del_canal_de_notificaciones
MENTION_ROLE_ID=id_del_rol_a_mencionar

TWITCH_CLIENT_ID=tu_client_id
TWITCH_CLIENT_SECRET=tu_client_secret
TWITCH_USERNAME=usuario_twitch

KICK_USERNAME=usuario_kick

YOUTUBE_API_KEY=tu_api_key_youtube
YOUTUBE_CHANNEL_ID=id_del_canal_youtube
4. Inicia el bot
bash
node index.js
🛠 Comandos disponibles
!force_check → fuerza la verificación de novedades en Twitch, Kick y YouTube.

!ping → prueba de latencia/respuesta del bot.

🔔 Notificaciones
Twitch/Kick: chequeo cada 1 minuto.

YouTube: chequeo cada 15 minutos (para evitar bloqueos de cuota API).

Los embeds incluyen título real, enlace abajo estilo Karl Bot y footers diferenciados por plataforma.

🧪 Smoke-test
Para verificar datos y embeds localmente sin Discord:

bash
node scripts/smoke-test.js
Esto imprime en consola los objetos y embeds generados para Twitch, Kick y YouTube.

📜 Changelog
v1.1.13 — 19/11/2025
Documentación completa: README.md unificado con instalación, comandos, notificaciones, smoke-test y changelog.

v1.1.12 — 19/11/2025
Notifier refactor: separación de funciones notifyTwitchKick() y notifyYouTube() para intervalos independientes.

Intervalos claros: Twitch/Kick cada 1 minuto, YouTube cada 15 minutos (protección de cuota API).

Cache inicial: sembrado para ambas funciones al arrancar, evitando spam en el primer ciclo.

v1.1.11 — 19/11/2025
Builders unificados: Twitch/Kick/YouTube ahora usan destructuring y fallbacks.

Notifier corregido: pasa objetos completos a los builders.

Fix thumbnail Twitch: reemplazo de %320x%180 → 320x180.

Smoke-test agregado: script para verificar datos y embeds localmente.

v1.1.0 — 18/11/2025
Refactor general: builders integrados y coherentes entre plataformas.

Estilo Karl Bot: título real primero, enlace abajo, footers diferenciados.

Notifier: mensajes uniformes y consistentes. 

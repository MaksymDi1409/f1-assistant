import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055";
const directusWsUrl = process.env.NEXT_PUBLIC_DIRECTUS_WS_URL ?? "ws://localhost:8055/websocket";

// Content Security Policy: звідки браузеру дозволено завантажувати скрипти, стилі,
// картинки та з ким з'єднуватися. Навіть якщо зловмисник впровадить на сторінку
// чужий <script src="https://evil.com/...">, браузер його не виконає (захист від XSS)
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js вбудовує невеликі скрипти прямо в HTML; у режимі розробки ще й потрібен eval
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Картинки статей і фото пілотів віддає Directus
  `img-src 'self' data: blob: ${directusUrl}`,
  "font-src 'self'",
  // Запити браузера: наш сервер, WebSocket Directus (і гаряче перезавантаження в розробці)
  `connect-src 'self' ${directusUrl} ${new URL(directusWsUrl).origin}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Сайт не можна вбудувати в чужий <iframe> (захист від clickjacking)
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Не вгадувати тип файлу: скрипт, замаскований під картинку, не виконається
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Те саме, що frame-ancestors, для старих браузерів
  { key: "X-Frame-Options", value: "DENY" },
  // При переході на інші сайти не передавати повну адресу сторінки
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Сайту не потрібні камера, мікрофон і геолокація
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Не показувати, на чому зроблено сайт (заголовок X-Powered-By: Next.js)
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
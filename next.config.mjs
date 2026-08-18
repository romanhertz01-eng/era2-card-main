/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Шрифты подключены через классический <link> в layout.tsx (см. комментарий там).
  // Отключаем встроенную оптимизацию, чтобы build не делал fetch на fonts.googleapis.com
  // и не падал/не ругался в окружениях без внешнего интернета.
  optimizeFonts: false,
};

export default nextConfig;

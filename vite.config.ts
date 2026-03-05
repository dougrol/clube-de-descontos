import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.png", "apple-touch-icon.png"],
        manifest: {
          name: "Tavares Car Club",
          short_name: "TavaresCar",
          description: "Clube de Vantagens Tavares Car - Descontos exclusivos para associados.",
          theme_color: "#050505",
          background_color: "#050505",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          categories: ["lifestyle", "shopping"],
          lang: "pt-BR",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          // Desativando temporariamente para evitar falha no vite-plugin-pwa generator
          /*screenshots: [
            { src: "/screenshots/screenshot-wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "Tela inicial do Clube de Vantagens" },
            { src: "/screenshots/screenshot-narrow.png", sizes: "720x1280", type: "image/png", form_factor: "narrow", label: "Tela inicial no celular" },
          ],*/
        },
      }),
      viteImagemin({
        gifsicle: { optimizationLevel: 7, interlaced: false },
        optipng: { optimizationLevel: 7 },
        mozjpeg: { quality: 20 },
        pngquant: { quality: [0.8, 0.9], speed: 4 },
        svgo: {
          plugins: [
            { name: "removeViewBox" },
            { name: "removeEmptyAttrs", active: false },
          ],
        },
      }),
    ],

    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        external: ["fsevents"],
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            supabase: ["@supabase/supabase-js"],
          },
        },
      },
    },
  };
});
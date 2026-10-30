// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro, env injection, @ alias and sandbox detection — do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        strategies: "generateSW",
        filename: "sw.js",
        manifest: false, // served from /public/manifest.webmanifest
        devOptions: { enabled: false },
        includeAssets: [
          "manifest.webmanifest",
          "favicon.png",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/icon-512-maskable.png",
          "icons/apple-touch-icon.png",
        ],
        workbox: {
          globPatterns: ["**/*.{js,css,woff,woff2,ttf,otf}"],
          navigateFallback: null, // online-first: never cache HTML
          navigateFallbackDenylist: [/^\/~oauth/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          modifyURLPrefix: { "client/": "" },
        },
      }),
    ],
  },
});

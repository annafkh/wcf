import "dotenv/config";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.SITE_URL || undefined;
const previewHost = "unnovercal-kayleigh-lenticularly.ngrok-free.dev";
if (site && !/^https:\/\/[^/]+\/?$/.test(site)) {
  throw new Error(
    "SITE_URL must be an HTTPS origin, for example https://your-domain.id",
  );
}
export default defineConfig({
  site,
  output: "server",
  session: false,
  security: {
    allowedDomains: [
      { hostname: previewHost, protocol: "https" },
      ...(site
        ? [{ hostname: new URL(site).hostname, protocol: "https" }]
        : []),
    ],
  },
  adapter: node({ mode: "standalone", bodySizeLimit: 6 * 1024 * 1024 }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [previewHost],
      fs: {
        deny: [
          "**/.env",
          "**/.env.*",
          "**/*.{crt,pem}",
          "**/.git/**",
          "**/.data/**",
          "**/admin.json",
          "**/content.json",
          "**/qa-fixture.json",
        ],
      },
    },
  },
  compressHTML: true,
});


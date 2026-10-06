import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.SITE_URL;
if (site && !/^https:\/\/[^/]+\/?$/.test(site)) {
  throw new Error(
    "SITE_URL must be an HTTPS origin, for example https://your-domain.id",
  );
}
export default defineConfig({
  site,
  output: "server",
  session: false,
  adapter: node({ mode: "standalone" }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["unnovercal-kayleigh-lenticularly.ngrok-free.dev"],
    },
  },
  compressHTML: true,
});

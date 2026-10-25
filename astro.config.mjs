// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite plugin for local development image uploads to public/uploads
 */
function devUploadPlugin() {
  return {
    name: 'dev-upload-plugin',
    configureServer(/** @type {any} */ server) {
      server.middlewares.use(async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
        if (req.url === '/__dev_upload_file' && req.method === 'POST') {
          try {
            let rawData = '';
            req.on('data', (/** @type {any} */ chunk) => { rawData += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(rawData);
                const { filename, base64Data } = parsed;
                const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(cleanBase64, 'base64');
                const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                fs.writeFileSync(filePath, buffer);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, url: `/uploads/${filename}` }));
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: String(err) }));
              }
            });
          } catch {
            next();
          }
          return;
        }
        next();
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  output: 'static',
  adapter: cloudflare(
    /** @type {any} */ ({
      prerenderEnvironment: 'node',
      platformProxy: {
        enabled: true,
        configPath: './wrangler.toml'
      },
      configPath: './wrangler.toml',
      persistState: true,
      imageService: 'passthrough'
    })
  ),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ],
  vite: {
    plugins: [devUploadPlugin()],
    ssr: {
      optimizeDeps: {
        noDiscovery: true,
        include: []
      }
    }
  },
  site: process.env.SITE_URL || 'https://framesbyhithu.pages.dev',
});

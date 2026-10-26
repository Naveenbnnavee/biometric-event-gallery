import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.resolve(projectRoot, 'dist');
const distClientDir = path.join(distDir, 'client');
const distServerDir = path.join(distDir, 'server');
const wranglerJsonPath = path.join(distServerDir, 'wrangler.json');
const dotWranglerDir = path.resolve(projectRoot, '.wrangler');

console.log('[fix-cloudflare-deploy] Starting post-build deploy preparations...');

// Load environment variables from .env if present (without external dependencies)
const envFilePath = path.join(projectRoot, '.env');
if (fs.existsSync(envFilePath)) {
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=') !== -1 ? trimmed.indexOf('=') : trimmed.indexOf(':');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('[fix-cloudflare-deploy] Note: Could not read .env file:', err);
  }
}

// 1. Sanitize or dynamically configure dist/server/wrangler.json
if (fs.existsSync(wranglerJsonPath)) {
  try {
    const raw = fs.readFileSync(wranglerJsonPath, 'utf8');
    const config = JSON.parse(raw);

    // KV Namespace ID resolution: strictly from environment variables or .env
    const envKvId = process.env.KV_NAMESPACE_ID || process.env.FH_STUDIO_KV_ID || process.env.CLOUDFLARE_KV_ID;

    if (envKvId && typeof envKvId === 'string' && /^[0-9a-f]{32}$/i.test(envKvId)) {
      config.kv_namespaces = [
        {
          binding: 'FH_STUDIO_KV',
          id: envKvId
        }
      ];
      console.log('[fix-cloudflare-deploy] ✓ Dynamically bound FH_STUDIO_KV from environment variable KV_NAMESPACE_ID');
    } else {
      // In Cloudflare Pages, KV bindings are attached via Cloudflare Dashboard
      // (Settings > Functions > KV namespace bindings). Remove placeholder or local entries.
      delete config.kv_namespaces;
      console.log('[fix-cloudflare-deploy] ✓ No local KV_NAMESPACE_ID provided; relying on Cloudflare Pages Dashboard binding');
    }

    // Cloudflare Pages forbids the "assets" block in Pages configuration files
    if (config.assets) {
      delete config.assets;
    }

    // Normalize pages_build_output_dir to 'dist'
    if (config.pages_build_output_dir) {
      config.pages_build_output_dir = 'dist';
    }

    // Remove unsupported/unexpected empty fields that trigger Wrangler warnings/errors in Pages
    const fieldsToRemove = [
      'definedEnvironments',
      'exports',
      'connect',
      'ai_search_namespaces',
      'ai_search',
      'agent_memory',
      'k2',
      'secrets_store_secrets',
      'artifacts',
      'unsafe_hello_world',
      'flagship',
      'worker_loaders',
      'ratelimits',
      'vpc_services',
      'vpc_networks',
      'python_modules',
      'previews'
    ];
    for (const field of fieldsToRemove) {
      delete config[field];
    }

    if (config.dev) {
      delete config.dev.enable_containers;
      delete config.dev.generate_types;
    }

    fs.writeFileSync(wranglerJsonPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('[fix-cloudflare-deploy] ✓ Sanitized dist/server/wrangler.json');
  } catch (err) {
    console.error('[fix-cloudflare-deploy] Error sanitizing wrangler.json:', err);
  }
} else {
  console.log('[fix-cloudflare-deploy] dist/server/wrangler.json not found, skipping sanitize.');
}

// 2. Generate dist/_worker.js bridge for Cloudflare Pages Advanced Mode
try {
  const workerBridgePath = path.join(distDir, '_worker.js');
  const workerBridgeContent = `// Cloudflare Pages Advanced Mode entrypoint
export { default } from './server/entry.mjs';
`;
  fs.writeFileSync(workerBridgePath, workerBridgeContent, 'utf8');
  console.log('[fix-cloudflare-deploy] ✓ Created dist/_worker.js bridge');
} catch (err) {
  console.error('[fix-cloudflare-deploy] Error writing dist/_worker.js:', err);
}

// 3. Copy files from dist/client into dist/ so Cloudflare Pages static file router finds them at root
if (fs.existsSync(distClientDir)) {
  try {
    const copyRecursive = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          // Do not overwrite dist/server or dist/client
          if (destPath === distServerDir || destPath === distClientDir) continue;
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyRecursive(srcPath, destPath);
        } else {
          // Do not overwrite dist/_worker.js
          if (destPath === path.join(distDir, '_worker.js')) continue;
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    copyRecursive(distClientDir, distDir);
    console.log('[fix-cloudflare-deploy] ✓ Copied static assets from dist/client to dist root for Pages serving');
  } catch (err) {
    console.error('[fix-cloudflare-deploy] Error copying client assets:', err);
  }
}

// 4. Remove .wrangler/deploy directory so Pages does not redirect to Worker config
try {
  const deployConfigPath = path.join(dotWranglerDir, 'deploy', 'config.json');
  if (fs.existsSync(deployConfigPath)) {
    fs.unlinkSync(deployConfigPath);
    console.log('[fix-cloudflare-deploy] ✓ Removed .wrangler/deploy/config.json');
  }
  const deployDir = path.join(dotWranglerDir, 'deploy');
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
} catch (err) {
  console.log('[fix-cloudflare-deploy] Note: .wrangler/deploy skipped or not present.');
}

console.log('[fix-cloudflare-deploy] Deployment preparation complete.');

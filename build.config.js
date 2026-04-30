// ============================================================================
// BUILD CONFIGURATION REFERENCE
// Complete implementations for Webpack, Vite, and Esbuild
// ============================================================================

/**
 * WEBPACK IMPLEMENTATION
 * Generates proper __bundler manifest, template, and resources
 * 
 * Usage: Include in webpack.config.js plugins array
 */

// File: plugins/webpack-bundler-plugin.js
class WebpackBundlerPlugin {
  constructor(options = {}) {
    this.template = options.template || './src/template.html';
    this.output = options.output || './index.html';
  }

  apply(compiler) {
    compiler.hooks.emit.tap('WebpackBundlerPlugin', (compilation) => {
      const fs = require('fs');
      const path = require('path');

      const manifest = {};
      const resources = [];

      // Scan all compiled assets
      Object.keys(compilation.assets).forEach((filename) => {
        const asset = compilation.assets[filename];
        const source = asset.source();

        // Skip source maps and other non-essential files
        if (filename.endsWith('.map')) return;

        const uuid = this.generateUUID();
        const mimeType = this.getMimeType(filename);

        // Create base64 encoded asset
        const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);
        manifest[uuid] = {
          mime: mimeType,
          compressed: false,
          data: buffer.toString('base64')
        };

        // Track resource
        resources.push({
          id: filename,
          uuid: uuid
        });
      });

      // Read template
      let templateContent = fs.readFileSync(this.template, 'utf-8');

      // Generate the bundled HTML
      const bundledHtml = this.createBundledHtml(
        manifest,
        templateContent,
        resources
      );

      // Add to compilation output
      compilation.assets[this.output] = {
        source: () => bundledHtml,
        size: () => bundledHtml.length
      };
    });
  }

  createBundledHtml(manifest, template, resources) {
    const manifestJson = JSON.stringify(manifest);
    const templateJson = JSON.stringify(template);
    const resourcesJson = JSON.stringify(resources);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Aaron Kankipati</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow-x: hidden; }
    body { background: #0A1515; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    #__bundler_loading { position: fixed; bottom: 20px; right: 20px; font: 13px/1.4 sans-serif; color: #666; background: #fff; padding: 8px 14px; border-radius: 8px; z-index: 10000; }
    #__bundler_thumbnail { position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0A1515; z-index: 9999; overflow: hidden; }
  </style>
</head>
<body>
  <div id="__bundler_thumbnail">
    <div id="__bundler_placeholder">Loading...</div>
  </div>
  <div id="__bundler_loading">Unpacking...</div>

  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      const loading = document.getElementById('__bundler_loading');
      function setStatus(msg) { if (loading) loading.textContent = msg; }

      try {
        const manifestEl = document.querySelector('script[type="__bundler/manifest"]');
        const templateEl = document.querySelector('script[type="__bundler/template"]');
        
        if (!manifestEl || !templateEl) {
          setStatus('Error: missing bundle data');
          console.error('[bundler] Missing script tags');
          return;
        }

        const manifest = JSON.parse(manifestEl.textContent);
        let template = JSON.parse(templateEl.textContent);

        const uuids = Object.keys(manifest);
        setStatus('Unpacking ' + uuids.length + ' assets...');

        const blobUrls = {};
        await Promise.all(uuids.map(async (uuid) => {
          const entry = manifest[uuid];
          try {
            const binaryStr = atob(entry.data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            blobUrls[uuid] = URL.createObjectURL(new Blob([bytes], { type: entry.mime }));
          } catch (err) {
            console.error('Failed to decode asset ' + uuid + ':', err);
            blobUrls[uuid] = URL.createObjectURL(new Blob([], { type: entry.mime }));
          }
        }));

        setStatus('Rendering...');
        for (const uuid of uuids) template = template.split(uuid).join(blobUrls[uuid]);

        const doc = new DOMParser().parseFromString(template, 'text/html');
        document.documentElement.replaceWith(doc.documentElement);
      } catch (err) {
        setStatus('Error unpacking: ' + err.message);
        console.error('Bundle unpack error:', err);
      }
    });
  </script>

  <script type="__bundler/manifest">
  ${manifestJson}
  </script>

  <script type="__bundler/template">
  ${templateJson}
  </script>

  <script type="__bundler/ext_resources">
  ${resourcesJson}
  </script>
</body>
</html>`;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16));
  }

  getMimeType(filename) {
    const ext = require('path').extname(filename).toLowerCase();
    const types = {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };
    return types[ext] || 'application/octet-stream';
  }
}

module.exports = WebpackBundlerPlugin;

// Usage in webpack.config.js:
// const BundlerPlugin = require('./plugins/webpack-bundler-plugin');
// module.exports = {
//   plugins: [new BundlerPlugin()]
// };

// ============================================================================

/**
 * VITE IMPLEMENTATION
 * Modern bundler with better performance
 * 
 * Usage: Include in vite.config.js plugins array
 */

// File: plugins/vite-bundler-plugin.js
function viteBundlerPlugin(options = {}) {
  const template = options.template || './src/template.html';
  
  return {
    name: 'vite-bundler-plugin',
    apply: 'build',
    
    async generateBundle(outputOptions, bundle) {
      const fs = require('fs');
      const path = require('path');

      const manifest = {};
      const resources = [];

      // Process all output files
      for (const [filename, asset] of Object.entries(bundle)) {
        if (filename.endsWith('.map')) continue;

        const uuid = this.generateUUID();
        const source = asset.type === 'asset' ? asset.source : asset.code;
        const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);

        manifest[uuid] = {
          mime: this.getMimeType(filename),
          compressed: false,
          data: buffer.toString('base64')
        };

        resources.push({ id: filename, uuid });
      }

      // Read and prepare template
      let templateContent = fs.readFileSync(template, 'utf-8');

      // Generate bundled HTML
      const bundledHtml = this.createBundledHtml(manifest, templateContent, resources);

      // Replace index.html in bundle
      delete bundle['index.html'];
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: bundledHtml
      });
    },

    createBundledHtml(manifest, template, resources) {
      const manifestJson = JSON.stringify(manifest);
      const templateJson = JSON.stringify(template);
      const resourcesJson = JSON.stringify(resources);

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aaron Kankipati</title>
</head>
<body>
  <div id="__bundler_loading">Unpacking...</div>
  <script>
    // Bundle unpacking logic
    document.addEventListener('DOMContentLoaded', async function() {
      const manifest = ${manifestJson};
      let template = ${templateJson};
      
      const blobUrls = {};
      for (const uuid of Object.keys(manifest)) {
        const entry = manifest[uuid];
        const binaryStr = atob(entry.data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        blobUrls[uuid] = URL.createObjectURL(new Blob([bytes], { type: entry.mime }));
      }
      
      for (const uuid of Object.keys(blobUrls)) {
        template = template.split(uuid).join(blobUrls[uuid]);
      }
      
      const doc = new DOMParser().parseFromString(template, 'text/html');
      document.documentElement.replaceWith(doc.documentElement);
    });
  </script>
</body>
</html>`;
    },

    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16));
    },

    getMimeType(filename) {
      const ext = require('path').extname(filename).toLowerCase();
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
      return types[ext] || 'application/octet-stream';
    }
  };
}

module.exports = viteBundlerPlugin;

// ============================================================================

/**
 * ESBUILD IMPLEMENTATION
 * Fast bundler with simple setup
 * 
 * Usage: Include in build script
 */

// File: scripts/build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function esbuildBundler() {
  const templateFile = './src/template.html';

  const result = await esbuild.build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    minify: true,
    outdir: './dist',
    assetNames: '[name]-[hash]',
    loader: {
      '.png': 'dataurl',
      '.woff': 'file',
      '.woff2': 'file'
    }
  });

  // Gather all output files
  const manifest = {};
  const resources = [];
  const distDir = './dist';

  const files = fs.readdirSync(distDir);
  for (const file of files) {
    if (file === 'index.html') continue;

    const filepath = path.join(distDir, file);
    const content = fs.readFileSync(filepath);
    const uuid = generateUUID();

    manifest[uuid] = {
      mime: getMimeType(file),
      compressed: false,
      data: content.toString('base64')
    };

    resources.push({ id: file, uuid });
  }

  // Read template
  let template = fs.readFileSync(templateFile, 'utf-8');

  // Create bundled HTML
  const bundledHtml = createBundledHtml(manifest, template, resources);

  // Write to dist/index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), bundledHtml);
  console.log('✅ Generated dist/index.html with bundled assets');
}

function createBundledHtml(manifest, template, resources) {
  return `<!DOCTYPE html>
<html>
<body>
<script type="__bundler/manifest">${JSON.stringify(manifest)}</script>
<script type="__bundler/template">${JSON.stringify(template)}</script>
<script type="__bundler/ext_resources">${JSON.stringify(resources)}</script>
</body>
</html>`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16));
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
  };
  return types[ext] || 'application/octet-stream';
}

esbuildBundler().catch(console.error);

// ============================================================================
// KEY POINTS
// ============================================================================

/*
1. MANIFEST STRUCTURE
   - Maps UUIDs to base64-encoded assets
   - Each asset has: mime, compressed, data
   - Generated during build, injected into __bundler/manifest script

2. TEMPLATE STRUCTURE
   - Full HTML as JSON string
   - UUIDs used as placeholders for assets
   - Injected into __bundler/template script

3. RESOURCES STRUCTURE
   - Array mapping resource IDs to UUIDs
   - Injected into __bundler/ext_resources script

4. BUILD PROCESS
   - Collect all compiled assets
   - Generate unique UUID for each
   - Base64 encode asset content
   - Read HTML template
   - Replace placeholders with UUIDs
   - Create final __bundler/manifest script
   - Create final __bundler/template script
   - Write to index.html

5. VERIFICATION
   Check that dist/index.html contains:
   - Non-empty __bundler/manifest with valid JSON
   - Non-empty __bundler/template with valid JSON string
   - Non-empty __bundler/ext_resources with valid JSON array
*/

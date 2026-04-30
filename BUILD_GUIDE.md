# Build & QA Guide

## Problem Summary

The `index.html` file has an **empty `__bundler/template` script tag** (line 263-264), which causes the webpage to freeze/hang because:

1. The bundler tries to parse the template (line 140): `JSON.parse(templateEl.textContent)`
2. Parsing an empty string fails or returns invalid data
3. The rendering process breaks at line 192 when trying to replace UUIDs
4. The page stays stuck on "Unpacking..." state

## Solution

The bundler system requires three properly populated script tags:

```html
<script type="__bundler/manifest">
{"uuid": {...asset data...}}
</script>

<script type="__bundler/template">
"<html>...</html>"
</script>

<script type="__bundler/ext_resources">
[{...resources...}]
</script>
```

---

## 1. QA TESTING - Minimal Working Example

### Quick Test (5 minutes)

Open `test.html` in a browser to verify the design works without bundling:

```bash
# Files included:
- test.html     # ✓ Loads immediately (no bundler)
- index.html    # ✗ Frozen (empty template)
```

**What to test:**
- ✅ Page displays without freezing
- ✅ Layout renders: sidebar + main content
- ✅ Name "Aaron Kankipati" displays correctly
- ✅ Responsive on mobile (resize window to test)
- ✅ Open DevTools (F12) → Console shows no errors

### QA Checklist

- [ ] test.html loads without errors
- [ ] Sidebar visible on left (340px width)
- [ ] "Aaron Kankipati" text displays with correct colors
- [ ] "SENIOR PRODUCT OWNER" subtitle visible
- [ ] Navigation links visible
- [ ] Mobile view works (width < 768px)
- [ ] No console errors

---

## 2. BUILD CONFIGURATION

Your bundler is responsible for generating three things:

### A. Manifest (`__bundler/manifest`)

Map of UUID → asset data. Each asset contains:
- `mime`: MIME type (image/png, text/css, etc.)
- `compressed`: boolean (gzip compressed or not)
- `data`: base64-encoded asset content

```json
{
  "d6974d50-ac58-430d-8659-68b663c8a6b6": {
    "mime": "image/png",
    "compressed": false,
    "data": "iVBORw0KGgoAAAANSUhEUgAABD4..."
  }
}
```

### B. Template (`__bundler/template`)

A **JSON-stringified HTML** containing the complete page with UUIDs as placeholders:

```json
"<html><head>...</head><body>Content with uuid1 uuid2 ...</body></html>"
```

The bundler replaces these UUIDs with blob URLs at runtime.

### C. External Resources (`__bundler/ext_resources`)

Maps resource IDs to their UUID:

```json
[
  { "id": "logo.png", "uuid": "d6974d50-ac58-430d-8659-68b663c8a6b6" },
  { "id": "styles.css", "uuid": "a1234567-89ab-cdef-0123-456789abcdef" }
]
```

---

## 3. BUILD TOOL SETUP

### Using Webpack

```javascript
// webpack.config.js
const BundlerPlugin = require('./plugins/bundler-plugin');

module.exports = {
  entry: './src/index.js',
  output: { filename: 'bundle.js' },
  plugins: [
    new BundlerPlugin({
      template: './src/template.html',
      output: './dist/index.html'
    })
  ]
};
```

**Plugin responsibilities:**
1. Collect all built assets (JS, CSS, images, fonts)
2. Base64 encode each asset
3. Generate manifest with UUID mappings
4. Read template.html and inject UUIDs
5. Create final index.html with all three script tags

### Using Vite

```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist'
  },
  plugins: [
    {
      name: 'bundler-plugin',
      generateBundle(options, bundle) {
        // 1. Extract assets from bundle
        // 2. Generate manifest
        // 3. Read template and inject UUIDs
        // 4. Replace/create index.html
      }
    }
  ]
};
```

### Using Esbuild

```javascript
// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [
    {
      name: 'bundler',
      setup(build) {
        build.onEnd(result => {
          // 1. Scan dist directory
          // 2. Generate manifest from files
          // 3. Create bundled index.html
        });
      }
    }
  ]
});
```

---

## 4. TEMPLATE FILE STRUCTURE

Create `src/template.html` with placeholders for assets:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aaron Kankipati</title>
  <link rel="stylesheet" href="{{styles-uuid}}">
</head>
<body>
  <img src="{{logo-uuid}}" alt="Logo">
  <h1>Aaron Kankipati</h1>
  <script src="{{bundle-uuid}}"></script>
</body>
</html>
```

The build process replaces `{{uuid-placeholders}}` with actual UUIDs that match the manifest.

---

## 5. STEP-BY-STEP FIX

### For Webpack Users

1. **Install/create bundler plugin:**
   ```bash
   npm install --save-dev webpack
   ```

2. **Create `plugins/bundler-plugin.js`:**
   ```javascript
   const fs = require('fs');
   const path = require('path');

   class BundlerPlugin {
     constructor(options = {}) {
       this.template = options.template || './src/template.html';
       this.output = options.output || './dist/index.html';
     }

     apply(compiler) {
       compiler.hooks.emit.tap('BundlerPlugin', (compilation) => {
         const manifest = {};
         const resources = [];

         // Collect all assets
         Object.keys(compilation.assets).forEach(filename => {
           const asset = compilation.assets[filename];
           const uuid = this.generateUUID();
           
           manifest[uuid] = {
             mime: this.getMimeType(filename),
             compressed: false,
             data: asset.source().toString('base64')
           };

           resources.push({ id: filename, uuid });
         });

         // Read template
         let template = fs.readFileSync(this.template, 'utf-8');

         // Generate final HTML
         const html = this.generateBundledHtml(manifest, template, resources);
         
         // Write to output
         compilation.assets[path.basename(this.output)] = {
           source: () => html,
           size: () => html.length
         };
       });
     }

     generateUUID() {
       return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
         .replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16));
     }

     getMimeType(filename) {
       const ext = path.extname(filename);
       const types = {
         '.js': 'text/javascript', '.css': 'text/css',
         '.png': 'image/png', '.jpg': 'image/jpeg'
       };
       return types[ext] || 'application/octet-stream';
     }

     generateBundledHtml(manifest, template, resources) {
       const manifestJson = JSON.stringify(manifest);
       const templateJson = JSON.stringify(template);
       const resourcesJson = JSON.stringify(resources);

       return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script type="__bundler/manifest">${manifestJson}</script>
<script type="__bundler/template">${templateJson}</script>
<script type="__bundler/ext_resources">${resourcesJson}</script>
</body>
</html>`;
     }
   }

   module.exports = BundlerPlugin;
   ```

3. **Update webpack.config.js:**
   ```javascript
   const BundlerPlugin = require('./plugins/bundler-plugin');

   module.exports = {
     plugins: [new BundlerPlugin()]
   };
   ```

4. **Run build:**
   ```bash
   npm run build
   # This generates dist/index.html with proper manifest & template
   ```

---

## 6. VERIFY THE FIX

After building:

```bash
# Check that all three script tags are populated
grep -c "__bundler/manifest" dist/index.html  # Should be > 0
grep -c "__bundler/template" dist/index.html  # Should be > 0
grep -c "__bundler/ext_resources" dist/index.html  # Should be > 0

# Open in browser
open dist/index.html
# Should load immediately without hanging
```

---

## 7. TROUBLESHOOTING

### Symptom: Page still frozen

**Cause:** Template still empty
**Fix:** Verify build configuration creates template with full HTML content

### Symptom: "Error: missing bundle data"

**Cause:** Manifest or template script tags missing
**Fix:** Check that build process writes all three script tags

### Symptom: Assets not loading (broken images)

**Cause:** Manifest UUIDs don't match template placeholders
**Fix:** Ensure build consistently generates same UUIDs for both

### Symptom: "Error unpacking" in console

**Cause:** Invalid base64 in manifest or corrupted asset data
**Fix:** Verify asset encoding: `Buffer.from(data).toString('base64')`

---

## Reference Files Included

1. **test.html** - Works without bundler (QA baseline)
2. **build.config.js** - Reference implementations for Webpack, Vite, Esbuild
3. **BUILD_GUIDE.md** - This file
4. **index.html** - Current broken file (shows __bundler/template is empty)

---

## Next Steps

1. ✅ Run QA test with `test.html`
2. ✅ Identify your build tool (Webpack/Vite/Esbuild)
3. ✅ Set up bundler plugin using reference code
4. ✅ Build and verify all three script tags are populated
5. ✅ Test in browser - page should load without freezing

**Questions?** Check the build tool's documentation or see `build.config.js` for full examples.

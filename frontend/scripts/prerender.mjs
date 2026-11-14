import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distPath = path.resolve(root, 'dist')
const ssrPath = path.resolve(distPath, '.ssr')

import { PRERENDERED_PAGES, PRERENDERED_PATHS, SITE_URL, absUrl } from '../src/seo/seoData.js'

// Páginas, títulos y descripciones salen de src/seo/seoData.js (misma fuente
// que el sitio y el sitemap).
const ROUTES = PRERENDERED_PATHS
const SEO_PER_ROUTE = Object.fromEntries(
  PRERENDERED_PAGES.map((p) => [
    p.path,
    {
      title: p.title,
      description: p.description,
      canonical: absUrl(p.path),
      ogUrl: absUrl(p.path),
      image: `${SITE_URL}${p.image}`,
    },
  ]),
)

const escapeHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function patchMeta(html, seo) {
  let out = html
  seo = Object.fromEntries(Object.entries(seo).map(([k, v]) => [k, escapeHtml(v)]))
  if (seo.image) {
    out = out.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${seo.image}$2`)
    out = out.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${seo.image}$2`)
  }
  if (seo.title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`)
    out = out.replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${seo.title}$2`)
    out = out.replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${seo.title}$2`)
  }
  if (seo.description) {
    out = out.replace(/(<meta name="description" content=")[^"]*(")/,    `$1${seo.description}$2`)
    out = out.replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${seo.description}$2`)
    out = out.replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${seo.description}$2`)
  }
  if (seo.canonical) {
    out = out.replace(/(<link rel="canonical" href=")[^"]*(")/,          `$1${seo.canonical}$2`)
  }
  if (seo.ogUrl) {
    out = out.replace(/(<meta property="og:url" content=")[^"]*(")/,     `$1${seo.ogUrl}$2`)
    out = out.replace(/(<meta name="twitter:url" content=")[^"]*(")/,    `$1${seo.ogUrl}$2`)
  }
  return out
}

// Load SSR entry built by Vite
const { render } = await import(path.join(ssrPath, 'entry-server.js'))

// Base HTML template from client build
const template = (await fs.readFile(path.join(distPath, 'index.html'), 'utf-8')).replace(
  /var prerendered = \[[^\]]*\];/,
  `var prerendered = ${JSON.stringify(PRERENDERED_PATHS)};`,
)

for (const url of ROUTES) {
  process.stdout.write(`Rendering ${url} ...`)

  const appHtml = render(url)

  // Inject rendered HTML and mark as server-rendered for hydration
  let html = template.replace(
    '<div id="root"><!--app-html--></div>',
    `<div id="root" data-server-rendered="true">${appHtml}</div>`
  )

  // Patch meta tags per route
  const seo = SEO_PER_ROUTE[url]
  if (seo) html = patchMeta(html, seo)

  // dist/index.html para el inicio y dist/<ruta>.html para el resto: así
  // Cloudflare sirve /<ruta> directo (200) sin redirigir a /<ruta>/, y la URL
  // coincide con el canonical y el sitemap.
  const file =
    url === '/'
      ? path.join(distPath, 'index.html')
      : path.join(distPath, ...url.split('/').filter(Boolean)) + '.html'
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, html)

  console.log(` done → ${path.relative(root, file)}`)
}

// Sitemap generado en cada build (fecha de hoy, solo páginas indexables).
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PRERENDERED_PAGES.map((p) => `  <url>
    <loc>${absUrl(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <image:image><image:loc>${SITE_URL}${p.image}</image:loc></image:image>
  </url>`).join('\n')}
</urlset>
`
await fs.writeFile(path.join(distPath, 'sitemap.xml'), sitemap)
console.log(`sitemap.xml → ${PRERENDERED_PAGES.length} URLs`)

// Remove SSR artifacts (not needed in deployment)
await fs.rm(ssrPath, { recursive: true, force: true })

console.log('\nPrerendering complete!')

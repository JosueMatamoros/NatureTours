import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distPath = path.resolve(root, 'dist')
const ssrPath = path.resolve(distPath, '.ssr')

const ROUTES = ['/', '/tours', '/about', '/services', '/contact']

const SEO_PER_ROUTE = {
  '/': {
    title: 'Nature Tours La Fortuna | Horseback Riding Tours in Costa Rica',
    description: 'Experience the best horseback riding tours in La Fortuna, Costa Rica. Explore lush rainforest trails, river crossings, and stunning tropical nature. Book your adventure today!',
    canonical: 'https://naturetourslafortuna.com/',
    ogUrl: 'https://naturetourslafortuna.com/',
  },
  '/tours': {
    title: 'Horseback Riding Tours in La Fortuna | Nature Tours Costa Rica',
    description: 'Explore La Fortuna on horseback through breathtaking rainforest scenery. Sunset rides, river crossings, mountain trails, and unforgettable experiences with well-trained horses. Perfect for families!',
    canonical: 'https://naturetourslafortuna.com/tours',
    ogUrl: 'https://naturetourslafortuna.com/tours',
  },
  '/about': {
    title: 'About Us | Nature Tours La Fortuna - Family Owned Horse Tours',
    description: 'Meet the family behind Nature Tours La Fortuna. We are passionate about sharing authentic Costa Rican experiences with well-trained horses and personalized service near Arenal Volcano.',
    canonical: 'https://naturetourslafortuna.com/about',
    ogUrl: 'https://naturetourslafortuna.com/about',
  },
  '/services': {
    title: 'Services & Accommodation | Nature Tours La Fortuna Costa Rica',
    description: 'Rural lodging, villas and houses near Arenal Volcano. Combine your horseback riding tour with an unforgettable stay surrounded by nature in La Fortuna.',
    canonical: 'https://naturetourslafortuna.com/services',
    ogUrl: 'https://naturetourslafortuna.com/services',
  },
  '/contact': {
    title: 'Contact Us | Nature Tours La Fortuna - Book Your Tour Today',
    description: 'Contact us to book your horseback riding tour in La Fortuna. WhatsApp available for quick responses. We\'re here to help you plan your Costa Rica adventure!',
    canonical: 'https://naturetourslafortuna.com/contact',
    ogUrl: 'https://naturetourslafortuna.com/contact',
  },
}

function patchMeta(html, seo) {
  let out = html
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
const template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8')

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

  // Write to dist/[route]/index.html
  const routeDir =
    url === '/'
      ? distPath
      : path.join(distPath, ...url.split('/').filter(Boolean))

  await fs.mkdir(routeDir, { recursive: true })
  await fs.writeFile(path.join(routeDir, 'index.html'), html)

  console.log(` done → dist${url === '/' ? '/index.html' : url + '/index.html'}`)
}

// Remove SSR artifacts (not needed in deployment)
await fs.rm(ssrPath, { recursive: true, force: true })

console.log('\nPrerendering complete!')

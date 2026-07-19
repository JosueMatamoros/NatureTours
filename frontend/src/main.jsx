import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// Solo se hidrata cuando el HTML servido corresponde a la ruta actual.
// En rutas no prerenderizadas (ej. /reseller/:id) el servidor devuelve el
// home prerenderizado: se descarta ese markup y se renderiza desde cero
// (index.html lo mantiene oculto con la clase spa-boot hasta el montaje).
const PRERENDERED = ['/', '/tours', '/about', '/services', '/contact']
const path = location.pathname.replace(/\/+$/, '') || '/'
const isPrerenderedRoute = PRERENDERED.includes(path)

if (root.dataset.serverRendered === 'true' && isPrerenderedRoute) {
  hydrateRoot(root, app)
} else {
  if (root.dataset.serverRendered === 'true') root.innerHTML = ''
  createRoot(root).render(app)
}

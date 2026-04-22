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

if (root.dataset.serverRendered === 'true') {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}

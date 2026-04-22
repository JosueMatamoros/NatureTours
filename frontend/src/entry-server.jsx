import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom'
import ScrollToTop from './ScrollToTop'

import Home from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import AboutUs from './pages/AboutUs'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import NotFound from './pages/NotFound'

function RootLayout() {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.pathname} />
      <ScrollToTop />
      <Outlet />
    </>
  )
}

const routes = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/tours', element: <ToursPage /> },
      { path: '/about', element: <AboutUs /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export function render(url) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return renderToString(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './styles/style.css'

import App from './pages/App.jsx'
import FormularioSolicitud from './pages/formularioSolicitud.jsx'
import Presupuesto from './pages/presupuesto.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/formulario-solicitud',
    element: <FormularioSolicitud />,
    
  },
  {
    path: '/presupuesto',
    element: <Presupuesto />,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

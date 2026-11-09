import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Root from './pages/Root'
import Home from './pages/Home'
// Publicas (Sin sidebar)
import Error404 from './pages/Error404'
import Login from './pages/Login'
import FormularioSolicitud from './pages/SolicitudEvento.jsx'
import FormularioEvaluacion from './pages/resenaEvento.jsx'
// Privadas (Con sidebar y JWT)
import CalendarioEvento from './pages/Calendario.jsx'
import RankingTrabajadores from './pages/RankingTrabajadores.jsx'
import PanelCatalogo from './pages/PanelCatalogo.jsx'

import Presupuestos from './pages/Presupuestos.jsx'
import PresupuestoEvento from './pages/PresupuestoEvento.jsx'
import ValidacionPresupuestos from './pages/ValidacionPresupuestos.jsx'
import EventosOrganizando from './pages/EventosOrganizando.jsx'
import ResenasEventos from './pages/MostrarResenaEvento.jsx'
import Perfil from './pages/Perfil.jsx'

import './styles/style.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      { 
        index: true, 
        element: <Navigate to="/login" replace /> 
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'solicitud-evento',
        element: <FormularioSolicitud />,
      },
        {
          path: 'evaluar-evento',
          element: <FormularioEvaluacion />,
        },
      {
          path: 'panel/eventos',
        element: <CalendarioEvento />,
      },
      {
        path: 'ranking-trabajadores',
        element: <RankingTrabajadores />,
      },
      {
        path: 'panel/catalogos',
        element: <PanelCatalogo />,
      },
      {
        path: 'panel/presupuestos',
        element: <Presupuestos />,
      },
      {
        path: 'panel/presupuestos/:codigo',
        element: <PresupuestoEvento />,
      },
      {
        path: 'panel/validacion-presupuestos',
        element: <ValidacionPresupuestos />,
      },
      {
        path: 'panel/resenas-eventos',
        element: <ResenasEventos />,
      },
      {
        path: 'panel/mi-perfil',
        element: <Perfil />,
      },
      {
        path: 'panel/eventos-organizando',
        element: <EventosOrganizando />,
      },
      {
        path: '*',
        element: <Error404 />,
      },
    ],
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

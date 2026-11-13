const menuConfig = {
  STAFF: [
    { title: 'Inicio', text: 'Vuelve al panel principal y consulta los accesos disponibles para tu rol.', icon: '🏠', to: '/home' },
    { title: 'Calendario de Eventos', text: 'Consulta la agenda de eventos y sus fechas.', icon: '📅', to: '/panel/eventos' },
    { title: 'Presupuestos', text: 'Prepara y gestiona los presupuestos de los eventos.', icon: '🧾', to: '/panel/presupuestos' },
    { title: 'Eventos en Organización', text: 'Asigna trabajadores y ajusta el equipamiento de los eventos en organización.', icon: '🛠️', to: '/panel/eventos-organizando' },
    { title: 'Ranking de Trabajadores', text: 'Compara la valoración, los cargos y la experiencia del personal.', icon: '🏆', to: '/ranking-trabajadores' },
    { title: 'Mi Perfil', text: 'Revisa tus datos personales y actualiza tus credenciales.', icon: '👤', to: '/panel/mi-perfil' },
  ],
  GERENTE: [
    { title: 'Inicio', text: 'Vuelve al panel principal y consulta los accesos disponibles para tu rol.', icon: '🏠', to: '/home' },
    { title: 'Calendario de Eventos', text: 'Consulta la agenda de eventos y sus fechas.', icon: '📅', to: '/panel/eventos' },
    { title: 'Presupuestos', text: 'Revisa los presupuestos registrados en el sistema.', icon: '🧾', to: '/panel/presupuestos' },
    { title: 'Validar Presupuestos', text: 'Aprueba o rechaza los presupuestos preparados por el staff.', icon: '✅', to: '/panel/validacion-presupuestos' },
    { title: 'Eventos en Organización', text: 'Consulta la preparación, personal y equipamiento de los eventos.', icon: '🛠️', to: '/panel/eventos-organizando' },
    { title: 'Gestionar Catálogos', text: 'Administra los catálogos disponibles para eventos y presupuestos.', icon: '🗂️', to: '/panel/catalogos' },
    { title: 'Ranking de Trabajadores', text: 'Compara la valoración, los cargos y la experiencia del personal.', icon: '🏆', to: '/ranking-trabajadores' },
    { title: 'Mi Perfil', text: 'Revisa tus datos personales y actualiza tus credenciales.', icon: '👤', to: '/panel/mi-perfil' },
  ],
  ADMIN: [
    { title: 'Inicio', text: 'Vuelve al panel principal y consulta los accesos disponibles para tu rol.', icon: '🏠', to: '/home' },
    { title: 'Presupuestos', text: 'Consulta los presupuestos registrados en el sistema.', icon: '🧾', to: '/panel/presupuestos' },
    { title: 'Eventos en Organización', text: 'Consulta la preparación, personal y equipamiento de los eventos.', icon: '🛠️', to: '/panel/eventos-organizando' },
    { title: 'Gestionar Catálogos', text: 'Administra los catálogos disponibles para eventos y presupuestos.', icon: '🗂️', to: '/panel/catalogos' },
    { title: 'Ranking de Trabajadores', text: 'Compara la valoración, los cargos y la experiencia del personal.', icon: '🏆', to: '/ranking-trabajadores' },
    { title: 'Usuarios', text: 'Administra las cuentas del personal interno.', icon: '👥', to: '/panel/usuarios' },
    { title: 'Mi Perfil', text: 'Revisa tus datos personales y actualiza tus credenciales.', icon: '👤', to: '/panel/mi-perfil' },
  ],
};

export default menuConfig;

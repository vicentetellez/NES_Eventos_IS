const CATEGORIAS_DETALLE = new Set([
    'PERSONAL',
    'EQUIPAMIENTO',
    'TRANSPORTE',
    'BANQUETERIA',
    'DECORACION',
    'OTRO'
]);

function validarEnteroNoNegativo(valor, nombre) {
    if (!Number.isSafeInteger(valor) || valor < 0) {
        throw new TypeError(`${nombre} debe ser un entero no negativo`);
    }
}

function calcularCantidadRequerida(plantilla, cantidadPersonas) {
    const cantidadFija = plantilla.cantidadFija ?? 0;
    const ratioInvitados = plantilla.ratioInvitados ?? 0;

    validarEnteroNoNegativo(cantidadFija, 'cantidadFija');
    validarEnteroNoNegativo(ratioInvitados, 'ratioInvitados');

    const cantidadVariable = ratioInvitados > 0
        ? Math.ceil(cantidadPersonas / ratioInvitados)
        : 0;

    return cantidadFija + cantidadVariable;
}

function crearDetalle({ categoria, descripcion, cantidad, precioUnitario }) {
    validarEnteroNoNegativo(cantidad, 'cantidad');
    validarEnteroNoNegativo(precioUnitario, 'precioUnitario');

    if (cantidad === 0) {
        throw new TypeError('cantidad debe ser mayor que cero');
    }

    const subtotal = cantidad * precioUnitario;
    validarEnteroNoNegativo(subtotal, 'subtotal');

    return { categoria, descripcion, cantidad, precioUnitario, subtotal };
}

export function calcularCotizacionInicial({
    tipoEvento,
    horasEvento,
    horasMontaje = 0,
    horasDesmontaje = 0,
    cantidadPersonas,
    plantillas = [],
    detallesAdicionales = []
}) {
    validarEnteroNoNegativo(horasEvento, 'horasEvento');
    validarEnteroNoNegativo(horasMontaje, 'horasMontaje');
    validarEnteroNoNegativo(horasDesmontaje, 'horasDesmontaje');
    validarEnteroNoNegativo(cantidadPersonas, 'cantidadPersonas');
    validarEnteroNoNegativo(tipoEvento?.tarifaHoraBaseReferencial, 'tarifaHoraBaseReferencial');

    if (horasEvento === 0) throw new TypeError('horasEvento debe ser mayor que cero');
    if (cantidadPersonas === 0) throw new TypeError('cantidadPersonas debe ser mayor que cero');
    if (!Array.isArray(plantillas) || !Array.isArray(detallesAdicionales)) {
        throw new TypeError('plantillas y detallesAdicionales deben ser listas');
    }

    const horasTotales = horasEvento + horasMontaje + horasDesmontaje;
    validarEnteroNoNegativo(horasTotales, 'horasTotales');

    const detalles = [crearDetalle({
        categoria: 'BASE_EVENTO',
        descripcion: `Tarifa base por ${horasTotales} horas`,
        cantidad: horasTotales,
        precioUnitario: tipoEvento.tarifaHoraBaseReferencial
    })];

    for (const plantilla of plantillas) {
        const cantidad = calcularCantidadRequerida(plantilla, cantidadPersonas);
        if (cantidad === 0) continue;

        const tieneEquipo = Boolean(plantilla.equipo);
        const tieneEspecialidad = Boolean(plantilla.especialidad);
        if (tieneEquipo === tieneEspecialidad) {
            throw new TypeError('cada plantilla debe definir exactamente un equipo o una especialidad');
        }

        if (tieneEquipo) {
            const tarifaHora = plantilla.equipo.arriendoHoraReferencial;
            validarEnteroNoNegativo(tarifaHora, 'arriendoHoraReferencial');
            detalles.push(crearDetalle({
                categoria: 'EQUIPAMIENTO',
                descripcion: `${plantilla.equipo.nombre} (estimado por ${horasTotales} horas)`,
                cantidad,
                precioUnitario: tarifaHora * horasTotales
            }));
        } else {
            const tarifaHora = plantilla.especialidad.tarifaHoraReferencial;
            validarEnteroNoNegativo(tarifaHora, 'tarifaHoraReferencial');
            detalles.push(crearDetalle({
                categoria: 'PERSONAL',
                descripcion: `${plantilla.especialidad.nombre} (estimado por ${horasTotales} horas)`,
                cantidad,
                precioUnitario: tarifaHora * horasTotales
            }));
        }
    }

    for (const detalle of detallesAdicionales) {
        if (!CATEGORIAS_DETALLE.has(detalle.categoria)) {
            throw new TypeError(`categoria no permitida: ${detalle.categoria}`);
        }
        detalles.push(crearDetalle(detalle));
    }

    const total = detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    validarEnteroNoNegativo(total, 'total');

    const primerAbono = Math.round(total * 0.5);

    return {
        moneda: 'CLP',
        incluyeIva: false,
        horasTotales,
        detalles,
        total,
        primerAbono,
        saldoInicial: total - primerAbono
    };
}
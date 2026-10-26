export const CATEGORIAS_DETALLE = [
    'BASE_EVENTO',
    'PERSONAL',
    'EQUIPAMIENTO',
    'TRANSPORTE',
    'BANQUETERIA',
    'DECORACION',
    'OTRO'
];

const PORCENTAJE_PRIMER_ABONO = 0.5;
const MAX_ENTERO_BD = 2147483647;

function validarEnteroNoNegativo(valor, nombre) {
    if (!Number.isSafeInteger(valor) || valor < 0) {
        throw new TypeError(`${nombre} debe ser un entero no negativo`);
    }
}

function validarMontoPersistible(valor, nombre) {
    validarEnteroNoNegativo(valor, nombre);
    if (valor > MAX_ENTERO_BD) {
        throw new TypeError(`${nombre} excede el monto máximo permitido`);
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

export function crearDetalle({ categoria, descripcion, cantidad, precioUnitario, codigoEspecialidad, rutTrabajador }) {
    if (!CATEGORIAS_DETALLE.includes(categoria)) {
        throw new TypeError(`categoria no permitida: ${categoria}`);
    }

    validarEnteroNoNegativo(cantidad, 'cantidad');
    validarMontoPersistible(precioUnitario, 'precioUnitario');

    if (cantidad === 0) {
        throw new TypeError('cantidad debe ser mayor que cero');
    }

    const subtotal = cantidad * precioUnitario;
    validarMontoPersistible(subtotal, 'subtotal');

    return {
        categoria,
        descripcion,
        cantidad,
        precioUnitario,
        subtotal,
        ...(codigoEspecialidad !== undefined && codigoEspecialidad !== null ? { codigoEspecialidad } : {}),
        ...(rutTrabajador ? { rutTrabajador } : {})
    };
}

// TODO: Revisar con la empresa la regla de margen antes de cerrar el presupuesto.
// Esta aplicación del porcentaje sobre el equipamiento es provisional.
export function calcularTotales(detalles, porcentajeMargen = 0) {
    validarEnteroNoNegativo(porcentajeMargen, 'porcentajeMargen');
    if (porcentajeMargen > 100) {
        throw new TypeError('porcentajeMargen no puede ser mayor a 100');
    }

    const subtotal = detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    const baseMargen = detalles
        .filter((detalle) => detalle.categoria === 'EQUIPAMIENTO')
        .reduce((suma, detalle) => suma + detalle.subtotal, 0);
    const montoMargen = Math.round(baseMargen * porcentajeMargen / 100);
    const total = subtotal + montoMargen;
    validarMontoPersistible(total, 'total');

    return { subtotal, montoMargen, total };
}

export function calcularPrimerAbono(total) {
    return Math.round(total * PORCENTAJE_PRIMER_ABONO);
}

// Genera las líneas base que se precargan en el formulario de presupuesto (el staff las puede modificar).
// - El personal fijo (sueldo mensual) no se cobra: su costo está cubierto por la tarifa base del evento.
// - El personal externo se estima con la tarifa referencial hasta que se asigne con su tarifa acordada.
export function calcularCotizacionInicial({
    tipoEvento = null,
    horasEvento,
    horasMontajeDesmontaje = 0,
    cantidadPersonas,
    plantillas = [],
    banqueterias = [],
    porcentajeMargen = 0
}) {
    validarEnteroNoNegativo(horasEvento, 'horasEvento');
    validarEnteroNoNegativo(horasMontajeDesmontaje, 'horasMontajeDesmontaje');
    validarEnteroNoNegativo(cantidadPersonas, 'cantidadPersonas');

    if (horasEvento === 0) throw new TypeError('horasEvento debe ser mayor que cero');
    if (cantidadPersonas === 0) throw new TypeError('cantidadPersonas debe ser mayor que cero');
    if (!Array.isArray(plantillas) || !Array.isArray(banqueterias)) {
        throw new TypeError('plantillas y banqueterias deben ser listas');
    }

    const horasTotales = horasEvento + horasMontajeDesmontaje;
    validarEnteroNoNegativo(horasTotales, 'horasTotales');

    const detalles = [];

    if (tipoEvento) {
        validarEnteroNoNegativo(tipoEvento.tarifaHoraBaseReferencial, 'tarifaHoraBaseReferencial');
        detalles.push(crearDetalle({
            categoria: 'BASE_EVENTO',
            descripcion: `Tarifa base por ${horasTotales} horas`,
            cantidad: horasTotales,
            precioUnitario: tipoEvento.tarifaHoraBaseReferencial
        }));
    }

    for (const plantilla of plantillas) {
        const tieneEquipo = Boolean(plantilla.equipo);
        const tieneEspecialidad = Boolean(plantilla.especialidad);
        if (tieneEquipo === tieneEspecialidad) {
            throw new TypeError('cada plantilla debe definir exactamente un equipo o una especialidad');
        }

        const cantidad = calcularCantidadRequerida(plantilla, cantidadPersonas);
        if (cantidad === 0) continue;

        if (tieneEquipo) {
            // Un equipo sin tarifa referencial se precarga en 0 para que el staff complete el precio.
            const tarifaHora = plantilla.equipo.arriendoHoraReferencial ?? 0;
            detalles.push(crearDetalle({
                categoria: 'EQUIPAMIENTO',
                descripcion: `${plantilla.equipo.nombre} (estimado por ${horasTotales} horas)`,
                cantidad,
                precioUnitario: tarifaHora * horasTotales
            }));
        } else {
            if (plantilla.especialidad.esPersonalFijo) continue;

            detalles.push(crearDetalle({
                categoria: 'PERSONAL',
                descripcion: `${plantilla.especialidad.nombre} (estimado por ${horasTotales} horas)`,
                cantidad,
                precioUnitario: plantilla.especialidad.tarifaHoraReferencial * horasTotales,
                codigoEspecialidad: plantilla.especialidad.codigo
            }));
        }
    }

    for (const asignacion of banqueterias) {
        if (asignacion.cantidadRequerida === 0) continue;

        detalles.push(crearDetalle({
            categoria: 'BANQUETERIA',
            descripcion: `${asignacion.banqueteria.nombre} (por persona)`,
            cantidad: asignacion.cantidadRequerida,
            precioUnitario: asignacion.banqueteria.precioPersonaReferencial
        }));
    }

    const totales = calcularTotales(detalles, porcentajeMargen);
    const primerAbono = calcularPrimerAbono(totales.total);

    return {
        horasTotales,
        porcentajeMargen,
        detalles,
        ...totales,
        primerAbono,
        saldoInicial: totales.total - primerAbono
    };
}

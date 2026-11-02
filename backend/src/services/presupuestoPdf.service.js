import PDFDocument from 'pdfkit';
import { AppError } from '../helpers/responses.js';
import { obtenerPresupuesto } from './presupuesto.service.js';

// El segundo abono se emite una vez pagado el primero (evento en organización o posterior)
const ESTADOS_EVENTO_CON_SEGUNDO_ABONO = [
    'ORGANIZANDO',
    'PENDIENTE_PAGO_FINAL',
    'EN_PREPARACION',
    'EN_EJECUCION',
    'FINALIZADO'
];

const ETIQUETAS_CATEGORIA = {
    BASE_EVENTO: 'Base del evento',
    PERSONAL: 'Personal',
    EQUIPAMIENTO: 'Equipamiento',
    TRANSPORTE: 'Transporte',
    BANQUETERIA: 'Banquetería',
    DECORACION: 'Decoración',
    OTRO: 'Otros',
    AJUSTE_EVENTO: 'Ajustes posteriores al primer abono'
};

const COLOR_ACENTO = '#c9a84c';
const COLOR_TEXTO = '#222222';
const COLOR_SUAVE = '#777777';
const MARGEN = 50;

const formatoCLP = (valor) => `$${Number(valor ?? 0).toLocaleString('es-CL')}`;
const formatoFecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '-');

// Helvetica estándar no dibuja flechas Unicode: se reemplazan (también en ajustes guardados con el formato anterior)
function limpiarDescripcion(texto) {
    return (texto ?? '').replaceAll('→', '->');
}

function filaDetalle(doc, y, columnas, { negrita = false, color = COLOR_TEXTO } = {}) {
    doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(color);
    const alturaDescripcion = doc.heightOfString(columnas.descripcion, { width: 270 });
    doc.text(columnas.descripcion, MARGEN, y, { width: 270 });
    doc.text(columnas.cantidad, 330, y, { width: 50, align: 'right' });
    doc.text(columnas.precio, 385, y, { width: 75, align: 'right' });
    doc.text(columnas.subtotal, 465, y, { width: 80, align: 'right' });
    return y + Math.max(alturaDescripcion, 12) + 4;
}

function asegurarEspacio(doc, y, necesario) {
    if (y + necesario > doc.page.height - MARGEN) {
        doc.addPage();
        return MARGEN;
    }
    return y;
}

function dibujarPdf(doc, { presupuesto, evento }) {
    const saldo = presupuesto.saldoPendiente ?? presupuesto.total - (evento.montoAbono ?? 0);

    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLOR_ACENTO).text('NES Eventos', MARGEN, MARGEN);
    doc.font('Helvetica').fontSize(11).fillColor(COLOR_TEXTO).text('Detalle del presupuesto y segundo abono');
    doc.moveDown(0.8);

    doc.fontSize(10).fillColor(COLOR_TEXTO);
    doc.text(`Evento N° ${evento.codigo}`);
    doc.text(`Cliente: ${evento.clienteNombre ?? '-'}`);
    doc.text(`Fecha del evento: ${formatoFecha(evento.fechaEvento)}`);
    doc.text(`Invitados: ${evento.cantidadPersonas}   |   Horas del evento: ${evento.horasEvento}   |   Montaje/desmontaje: ${evento.horasMontajeDesmontaje} h`);
    doc.text(`Emitido el: ${new Date().toLocaleDateString('es-CL')}`);
    doc.moveDown(1);

    let y = doc.y;
    y = filaDetalle(doc, y, { descripcion: 'Descripción', cantidad: 'Cant.', precio: 'P. unitario', subtotal: 'Subtotal' }, { negrita: true, color: COLOR_ACENTO });
    doc.moveTo(MARGEN, y - 2).lineTo(545, y - 2).strokeColor(COLOR_ACENTO).lineWidth(0.8).stroke();
    y += 2;

    for (const categoria of Object.keys(ETIQUETAS_CATEGORIA)) {
        const lineas = presupuesto.detalles.filter((detalle) => detalle.categoria === categoria);
        if (lineas.length === 0) continue;

        y = asegurarEspacio(doc, y, 40);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_TEXTO).text(ETIQUETAS_CATEGORIA[categoria], MARGEN, y);
        y += 15;

        for (const linea of lineas) {
            y = asegurarEspacio(doc, y, 24);
            y = filaDetalle(doc, y, {
                descripcion: limpiarDescripcion(linea.descripcion) || ETIQUETAS_CATEGORIA[categoria],
                cantidad: String(linea.cantidad),
                precio: formatoCLP(linea.precioUnitario),
                subtotal: formatoCLP(linea.subtotal)
            });
        }
        y += 4;
    }

    y = asegurarEspacio(doc, y, 130);
    doc.moveTo(MARGEN, y).lineTo(545, y).strokeColor(COLOR_SUAVE).lineWidth(0.5).stroke();
    y += 8;

    const resumen = [
        ['Subtotal', formatoCLP(presupuesto.subtotal)],
        [`Margen por arriendo a terceros (${presupuesto.porcentajeMargenArriendo}%)`, formatoCLP(presupuesto.montoMargen)],
        ['Total del evento', formatoCLP(presupuesto.total)],
        ['Primer abono pagado', `- ${formatoCLP(evento.montoAbono)}`]
    ];
    for (const [etiqueta, valor] of resumen) {
        doc.font('Helvetica').fontSize(10).fillColor(COLOR_TEXTO);
        doc.text(etiqueta, MARGEN, y, { width: 400 });
        doc.text(valor, 465, y, { width: 80, align: 'right' });
        y += 16;
    }

    doc.rect(MARGEN, y + 4, 495, 28).fillColor(COLOR_ACENTO).fill();
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
    doc.text('Segundo abono a pagar', MARGEN + 10, y + 12, { width: 300 });
    doc.text(formatoCLP(saldo), 445, y + 12, { width: 90, align: 'right' });
}

// Genera el PDF del segundo abono con el presupuesto vigente. Devuelve { buffer, nombreArchivo }.
export async function generarPdfSegundoAbono(codigoEvento) {
    const datos = await obtenerPresupuesto(codigoEvento);
    const { presupuesto, evento } = datos;

    if (!ESTADOS_EVENTO_CON_SEGUNDO_ABONO.includes(evento.estado)) {
        throw new AppError(
            `El segundo abono solo puede generarse con el primer abono pagado (estado actual: ${evento.estado})`,
            409
        );
    }
    if (presupuesto.estado !== 'VALIDADO') {
        throw new AppError('El presupuesto debe estar validado por el gerente para generar el PDF', 409);
    }

    const buffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: MARGEN, info: { Title: `Segundo abono - Evento ${evento.codigo}` } });
        const partes = [];
        doc.on('data', (parte) => partes.push(parte));
        doc.on('end', () => resolve(Buffer.concat(partes)));
        doc.on('error', reject);
        dibujarPdf(doc, datos);
        doc.end();
    });

    return { buffer, nombreArchivo: `segundo-abono-evento-${evento.codigo}.pdf` };
}

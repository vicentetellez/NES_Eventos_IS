import prisma from '../src/config/prisma.js';
import { DATABASE_URL, NODE_ENV, RANKING_DEMO_PUBLIC } from '../src/config/configEnv.js';

const workersDemo = [
    {
        rut: '11223344-K',
        specialty: 'DEMO - Banquetería',
        score: 4.8,
        experienceYears: 7
    },
    {
        rut: '55667788-3',
        specialty: 'DEMO - Producción de eventos',
        score: 4.5,
        experienceYears: 4
    }
];
const demoComment = '[DEMO FICTICIA] Calificación inventada sólo para demostración; no es una reseña de cliente.';

function validateDemoEnvironment() {
    if (NODE_ENV !== 'development' || !RANKING_DEMO_PUBLIC) {
        throw new Error('Activa NODE_ENV=development y RANKING_DEMO_PUBLIC=true para cargar datos DEMO.');
    }

    const databaseHost = new URL(DATABASE_URL).hostname.replace(/^\[|\]$/g, '');
    if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
        throw new Error('Los datos DEMO sólo se pueden cargar en una base PostgreSQL local.');
    }
}

async function main() {
    validateDemoEnvironment();
    const dryRun = process.argv.includes('--dry-run');
    const event = await prisma.evento.findFirst({
        where: { estado: 'FINALIZADO' },
        orderBy: { codigo: 'asc' },
        select: { codigo: true }
    });

    if (!event) {
        throw new Error('Se necesita al menos un evento FINALIZADO para enlazar las evaluaciones DEMO.');
    }

    const workers = await Promise.all(workersDemo.map(({ rut }) => prisma.trabajador.findUnique({
        where: { rut },
        select: { rut: true, aniosExperiencia: true }
    })));
    if (workers.some((worker) => !worker)) {
        throw new Error('No se encontraron los trabajadores de demostración definidos por la semilla.');
    }

    if (dryRun) {
        console.log(`Vista previa: se procesarían ${workersDemo.length} trabajadores en el evento ${event.codigo}. No se guardaron cambios.`);
        return;
    }

    const resultado = await prisma.$transaction(async (transaction) => {
        const resumen = { especialidadesCreadas: 0, asignacionesCreadas: 0, evaluacionesDemoCreadas: 0, experienciasCompletadas: 0 };

        for (const workerDemo of workersDemo) {
            let specialty = await transaction.especialidad.findUnique({
                where: { nombre: workerDemo.specialty }
            });
            if (!specialty) {
                specialty = await transaction.especialidad.create({
                    data: { nombre: workerDemo.specialty }
                });
                resumen.especialidadesCreadas += 1;
            }

            const existingAssignment = await transaction.trabajadorTieneEspecialidad.findUnique({
                where: {
                    rutTrabajador_codigoEspecialidad: {
                        rutTrabajador: workerDemo.rut,
                        codigoEspecialidad: specialty.codigo
                    }
                }
            });
            if (!existingAssignment) {
                await transaction.trabajadorTieneEspecialidad.create({
                    data: {
                        rutTrabajador: workerDemo.rut,
                        codigoEspecialidad: specialty.codigo
                    }
                });
                resumen.asignacionesCreadas += 1;
            }

            const existingEvaluation = await transaction.evaluacionTrabajador.findFirst({
                where: { rutTrabajador: workerDemo.rut }
            });
            if (!existingEvaluation) {
                await transaction.evaluacionTrabajador.create({
                    data: {
                        calificacion: workerDemo.score,
                        comentarioEspecifico: demoComment,
                        esAutogenerado: true,
                        codigoEvento: event.codigo,
                        codigoEspecialidad: specialty.codigo,
                        rutTrabajador: workerDemo.rut
                    }
                });
                resumen.evaluacionesDemoCreadas += 1;
            }

            const worker = workers.find((item) => item.rut === workerDemo.rut);
            if (worker.aniosExperiencia === null) {
                await transaction.trabajador.update({
                    where: { rut: workerDemo.rut },
                    data: { aniosExperiencia: workerDemo.experienceYears }
                });
                resumen.experienciasCompletadas += 1;
            }
        }

        return resumen;
    });

    console.log(`Datos de demostración aplicados: ${JSON.stringify(resultado)}. Las evaluaciones incluyen una marca DEMO FICTICIA.`);
}

main()
    .catch((error) => {
        console.error('No se pudieron cargar los datos de demostración:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
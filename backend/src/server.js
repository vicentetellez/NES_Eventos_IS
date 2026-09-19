import app from './app.js';
import prisma from './config/prisma.js';
import { PORT } from './config/configEnv.js';

async function bootstrap(){
    try {
        await prisma.$connect();
        console.log('Conexion a la base de datos exitosa.');

        app.listen(PORT, () => {
            console.log(`Servidor ejecutandose en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al conectar a la base de datos o iniciar el servidor:', error);
        process.exit(1);
    }
}

bootstrap();
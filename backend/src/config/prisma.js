import { PrismaClient } from '../../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from './configEnv.js';

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
// Creación de una instancia del cliente de Prisma más la configuración de logs
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

export default prisma;
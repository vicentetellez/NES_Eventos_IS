import { PrismaClient } from '../../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// Creación de una instancia del cliente de Prisma más la configuración de logs
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

export default prisma;
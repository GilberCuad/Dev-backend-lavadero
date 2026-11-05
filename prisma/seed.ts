import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || 'NoSecret',
    10,
  );
  await prisma.usuario.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@lavadero.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@lavadero.com',
      passwordHash,
      rol: 'ADMIN',
    },
  });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
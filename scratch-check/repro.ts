import 'dotenv/config';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const SERV1 = '73307852-1e21-4d10-86c0-92dc4633dcb7';
(async () => {
  console.log('>> A: $transaction en lista (findMany + count)');
  await prisma.$transaction([prisma.vehiculo.findMany({ take: 1 }), prisma.vehiculo.count()]);
  console.log('>> B: $transaction interactiva con create anidado (se deshace al final)');
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' }, select: { id: true } });
  try {
    await prisma.$transaction(async (tx) => {
      const v = await tx.vehiculo.upsert({ where: { placa: 'ZZZ999' }, update: {}, create: { placa: 'ZZZ999', tipo: 'CARRO' } });
      await tx.registroServicio.create({
        data: { vehiculoId: v.id, createdById: admin!.id, total: new Prisma.Decimal(1),
          detalles: { create: [{ servicioId: SERV1, precioAplicado: new Prisma.Decimal(1) }] }, empleados: { create: [] } },
      });
      throw new Error('ROLLBACK_INTENCIONAL');
    });
  } catch (e: any) { console.log('   rollback:', e.message); }
  console.log('>> C: consulta simple');
  await prisma.servicio.findMany();
  await prisma.$disconnect();
  console.log('>> fin');
})();

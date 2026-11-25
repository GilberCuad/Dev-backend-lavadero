import 'dotenv/config';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
(async () => {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' }, select: { id: true } });
  const servs = await prisma.servicio.findMany({ take: 2, select: { id: true, precio: true } });
  const emp = await prisma.empleado.findFirst({ select: { id: true } });
  console.log('>> D: create anidado con 2 detalles + 1 empleado (rollback)');
  try {
    await prisma.$transaction(async (tx) => {
      const v = await tx.vehiculo.upsert({ where: { placa: 'ZZZ998' }, update: {}, create: { placa: 'ZZZ998', tipo: 'CARRO' } });
      await tx.registroServicio.create({
        data: { vehiculoId: v.id, createdById: admin!.id, total: new Prisma.Decimal(1),
          detalles: { create: servs.map((s) => ({ servicioId: s.id, precioAplicado: s.precio })) },
          empleados: { create: [{ empleadoId: emp!.id }] } },
        include: { vehiculo: true, detalles: { include: { servicio: { select: { id: true, nombre: true } } } }, empleados: { include: { empleado: { select: { id: true, nombre: true } } } }, createdBy: { select: { id: true, nombre: true } } },
      });
      throw new Error('ROLLBACK_INTENCIONAL');
    });
  } catch (e: any) { console.log('   ', e.message); }
  console.log('>> E: throw justo despues de una consulta (como exigirTodos)');
  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehiculo.upsert({ where: { placa: 'ZZZ997' }, update: {}, create: { placa: 'ZZZ997', tipo: 'CARRO' } });
      await tx.servicio.findMany({ where: { id: { in: ['00000000-0000-4000-8000-000000000000'] } } });
      throw new Error('ROLLBACK_INTENCIONAL');
    });
  } catch (e: any) { console.log('   ', e.message); }
  console.log('>> F: 5 transacciones interactivas en paralelo');
  await Promise.allSettled(Array.from({ length: 5 }, () => prisma.$transaction(async (tx) => { await tx.servicio.findMany(); throw new Error('x'); })));
  console.log('>> G: 10 consultas en paralelo (como varias peticiones al mismo tiempo)');
  await Promise.all(Array.from({ length: 10 }, () => prisma.usuario.findUnique({ where: { id: admin!.id } })));
  await prisma.$disconnect();
  console.log('>> fin');
})();

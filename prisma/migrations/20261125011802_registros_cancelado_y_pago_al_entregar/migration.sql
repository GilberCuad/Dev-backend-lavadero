-- AlterEnum
ALTER TYPE "EstadoRegistroServicio" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "registros_servicio" ALTER COLUMN "metodo_pago" DROP NOT NULL;

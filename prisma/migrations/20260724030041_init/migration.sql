-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERARIO');

-- CreateEnum
CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('CARRO', 'MOTO');

-- CreateEnum
CREATE TYPE "EstadoRegistroServicio" AS ENUM ('EN_ESPERA', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoEmpleado" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_empleados" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_servicio" (
    "id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "estado" "EstadoRegistroServicio" NOT NULL DEFAULT 'EN_ESPERA',
    "metodo_pago" "MetodoPago" NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(3),
    "total" DECIMAL(10,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_servicio_detalle" (
    "id" TEXT NOT NULL,
    "registro_servicio_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "precio_aplicado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "registro_servicio_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_servicio_empleado" (
    "id" TEXT NOT NULL,
    "registro_servicio_id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,

    CONSTRAINT "registro_servicio_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- CreateIndex
CREATE INDEX "pagos_empleados_fecha_pago_idx" ON "pagos_empleados"("fecha_pago");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "registros_servicio_fecha_ingreso_idx" ON "registros_servicio"("fecha_ingreso");

-- CreateIndex
CREATE UNIQUE INDEX "registro_servicio_detalle_registro_servicio_id_servicio_id_key" ON "registro_servicio_detalle"("registro_servicio_id", "servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "registro_servicio_empleado_registro_servicio_id_empleado_id_key" ON "registro_servicio_empleado"("registro_servicio_id", "empleado_id");

-- AddForeignKey
ALTER TABLE "pagos_empleados" ADD CONSTRAINT "pagos_empleados_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_empleados" ADD CONSTRAINT "pagos_empleados_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_servicio" ADD CONSTRAINT "registros_servicio_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_servicio" ADD CONSTRAINT "registros_servicio_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_servicio_detalle" ADD CONSTRAINT "registro_servicio_detalle_registro_servicio_id_fkey" FOREIGN KEY ("registro_servicio_id") REFERENCES "registros_servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_servicio_detalle" ADD CONSTRAINT "registro_servicio_detalle_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_servicio_empleado" ADD CONSTRAINT "registro_servicio_empleado_registro_servicio_id_fkey" FOREIGN KEY ("registro_servicio_id") REFERENCES "registros_servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_servicio_empleado" ADD CONSTRAINT "registro_servicio_empleado_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

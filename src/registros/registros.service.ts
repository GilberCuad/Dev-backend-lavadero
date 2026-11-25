import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EstadoEmpleado,
  EstadoRegistroServicio,
  Prisma,
} from '../generated/prisma/client';
import { validarPlaca, tipoSegunPlaca } from '../vehiculos/placa.util';
import { CreateRegistroDto } from './dto/create-registro.dto';

// Qué se devuelve de un registro: nunca datos sensibles del usuario creador
const REGISTRO_INCLUDE = {
  vehiculo: true,
  detalles: {
    include: { servicio: { select: { id: true, nombre: true } } },
  },
  empleados: {
    include: { empleado: { select: { id: true, nombre: true } } },
  },
  createdBy: { select: { id: true, nombre: true } },
} satisfies Prisma.RegistroServicioInclude;

// Estados en los que el vehículo sigue en el lavadero
const ESTADOS_ABIERTOS: EstadoRegistroServicio[] = [
  EstadoRegistroServicio.EN_ESPERA,
  EstadoRegistroServicio.EN_PROCESO,
  EstadoRegistroServicio.TERMINADO,
];

@Injectable()
export class RegistrosService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const registro = await this.prisma.registroServicio.findUnique({
      where: { id },
      include: REGISTRO_INCLUDE,
    });
    if (!registro) {
      throw new NotFoundException('Registro no encontrado');
    }
    return registro;
  }

  // Todo o nada: si algo falla, no queda ni el vehículo ni el registro a medias
  async create(dto: CreateRegistroDto, createdById: string) {
    const placa = validarPlaca(dto.placa);
    const tipo = tipoSegunPlaca(placa)!; // validarPlaca ya garantizó el formato
    const empleadoIds = dto.empleadoIds ?? [];

    return this.prisma.$transaction(async (tx) => {
      const vehiculo = await tx.vehiculo.upsert({
        where: { placa },
        update: {},
        create: { placa, tipo },
      });

      const abierto = await tx.registroServicio.findFirst({
        where: { vehiculoId: vehiculo.id, estado: { in: ESTADOS_ABIERTOS } },
        select: { id: true },
      });
      if (abierto) {
        throw new ConflictException(
          `El vehículo ${placa} ya tiene un servicio en curso (${abierto.id})`,
        );
      }

      // Precios SIEMPRE desde el catálogo, nunca desde el cliente
      const servicios = await tx.servicio.findMany({
        where: { id: { in: dto.servicioIds }, activo: true },
        select: { id: true, precio: true },
      });
      exigirTodos(dto.servicioIds, servicios, 'servicios', 'activos');

      const empleados = await tx.empleado.findMany({
        where: { id: { in: empleadoIds }, estado: EstadoEmpleado.ACTIVO },
        select: { id: true },
      });
      exigirTodos(empleadoIds, empleados, 'empleados', 'activos');

      const total = servicios.reduce(
        (suma, s) => suma.add(s.precio),
        new Prisma.Decimal(0),
      );

      return tx.registroServicio.create({
        data: {
          vehiculoId: vehiculo.id,
          createdById,
          total,
          detalles: {
            create: servicios.map((s) => ({
              servicioId: s.id,
              precioAplicado: s.precio,
            })),
          },
          empleados: {
            create: empleadoIds.map((empleadoId) => ({ empleadoId })),
          },
        },
        include: REGISTRO_INCLUDE,
      });
    });
  }
}

// Si se pidieron N ids y la BD devolvió menos, alguno no existe o no es válido
function exigirTodos(
  pedidos: string[],
  encontrados: { id: string }[],
  entidad: string,
  condicion: string,
) {
  const ids = new Set(encontrados.map((e) => e.id));
  const faltantes = pedidos.filter((id) => !ids.has(id));
  if (faltantes.length > 0) {
    throw new BadRequestException(
      `Estos ${entidad} no existen o no están ${condicion}: ${faltantes.join(', ')}`,
    );
  }
}

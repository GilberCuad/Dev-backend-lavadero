import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(private prisma: PrismaService) {}

  // El OPERARIO solo ve servicios activos; el ADMIN ve todo el catálogo
  findAll(soloActivos: boolean) {
    return this.prisma.servicio.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string, soloActivos = false) {
    const servicio = await this.prisma.servicio.findFirst({
      where: soloActivos ? { id, activo: true } : { id },
    });
    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return servicio;
  }

  async create(dto: CreateServicioDto) {
    try {
      return await this.prisma.servicio.create({
        data: {
          nombre: normalizarNombre(dto.nombre),
          precio: dto.precio,
        },
      });
    } catch (error) {
      manejarNombreDuplicado(error);
    }
  }

  async update(id: string, dto: UpdateServicioDto) {
    await this.findOne(id);
    try {
      return await this.prisma.servicio.update({
        where: { id },
        data: {
          nombre: dto.nombre ? normalizarNombre(dto.nombre) : undefined,
          precio: dto.precio,
        },
      });
    } catch (error) {
      manejarNombreDuplicado(error);
    }
  }

  async cambiarEstado(id: string, activo: boolean) {
    await this.findOne(id);
    return this.prisma.servicio.update({ where: { id }, data: { activo } });
  }
}

// "  Lavado   básico " → "Lavado básico"
function normalizarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, ' ');
}

// P2002 = violación de restricción única (nombre repetido)
function manejarNombreDuplicado(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Ya existe un servicio con ese nombre');
  }
  throw error;
}

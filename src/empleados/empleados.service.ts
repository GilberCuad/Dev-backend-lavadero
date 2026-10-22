import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoEmpleado, Prisma } from '../generated/prisma/client';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmpleadosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.empleado.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const empleado = await this.prisma.empleado.findUnique({ where: { id } });
    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }
    return empleado;
  }

  async create(dto: CreateEmpleadoDto) {
    try {
      return await this.prisma.empleado.create({
        data: {
          nombre: dto.nombre,
          documento: dto.documento,
          cargo: dto.cargo,
          fechaIngreso: new Date(dto.fechaIngreso),
        },
      });
    } catch (error) {
      this.manejarDocumentoDuplicado(error);
    }
  }

  async update(id: string, dto: UpdateEmpleadoDto) {
    await this.findOne(id);
    try {
      return await this.prisma.empleado.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          documento: dto.documento,
          cargo: dto.cargo,
          fechaIngreso: dto.fechaIngreso
            ? new Date(dto.fechaIngreso)
            : undefined,
        },
      });
    } catch (error) {
      this.manejarDocumentoDuplicado(error);
    }
  }

  async cambiarEstado(id: string, estado: EstadoEmpleado) {
    await this.findOne(id);
    return this.prisma.empleado.update({ where: { id }, data: { estado } });
  }

  // P2002 = violación de restricción única (documento repetido)
  private manejarDocumentoDuplicado(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un empleado con ese documento');
    }
    throw error;
  }
}

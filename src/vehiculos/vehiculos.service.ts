import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { validarPlaca } from './placa.util';

const LIMITE_MAXIMO = 100;

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  // Paginado: el listado crecerá con cada vehículo nuevo que entre al lavadero
  async findAll(pagina: number, limite: number) {
    const paginaSegura = Math.max(1, pagina);
    const limiteSeguro = Math.min(Math.max(1, limite), LIMITE_MAXIMO);

    const [datos, total] = await this.prisma.$transaction([
      this.prisma.vehiculo.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (paginaSegura - 1) * limiteSeguro,
        take: limiteSeguro,
      }),
      this.prisma.vehiculo.count(),
    ]);

    return { datos, total, pagina: paginaSegura, limite: limiteSeguro };
  }

  async findOne(id: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehiculo;
  }

  async findByPlaca(placa: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: validarPlaca(placa) },
    });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehiculo;
  }

  // Corrige placa y/o tipo; el resultado final siempre debe ser coherente
  async update(id: string, dto: UpdateVehiculoDto) {
    const actual = await this.findOne(id);
    const tipo = dto.tipo ?? actual.tipo;
    const placa = validarPlaca(dto.placa ?? actual.placa, tipo);

    try {
      return await this.prisma.vehiculo.update({
        where: { id },
        data: { placa, tipo },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un vehículo con esa placa');
      }
      throw error;
    }
  }
}

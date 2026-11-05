import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';

const BCRYPT_ROUNDS = 10;

// Campos que se pueden devolver al cliente: passwordHash NUNCA está aquí
const USUARIO_PUBLICO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: USUARIO_PUBLICO,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: USUARIO_PUBLICO,
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      return await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre,
          email: normalizarEmail(dto.email),
          passwordHash,
          rol: dto.rol,
        },
        select: USUARIO_PUBLICO,
      });
    } catch (error) {
      manejarEmailDuplicado(error);
    }
  }

  async update(id: string, dto: UpdateUsuarioDto, actorId: string) {
    const usuario = await this.findOne(id);
    if (id === actorId && dto.rol && dto.rol !== usuario.rol) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          email: dto.email ? normalizarEmail(dto.email) : undefined,
          rol: dto.rol,
        },
        select: USUARIO_PUBLICO,
      });
    } catch (error) {
      manejarEmailDuplicado(error);
    }
  }

  async cambiarEstado(id: string, activo: boolean, actorId: string) {
    if (id === actorId && !activo) {
      throw new BadRequestException('No puedes desactivarte a ti mismo');
    }
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo },
      select: USUARIO_PUBLICO,
    });
  }

  // El propio usuario: debe conocer su contraseña actual
  async cambiarPassword(userId: string, dto: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const actualValida = await bcrypt.compare(
      dto.passwordActual,
      usuario.passwordHash,
    );
    if (!actualValida) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    if (dto.passwordActual === dto.passwordNueva) {
      throw new BadRequestException(
        'La contraseña nueva debe ser distinta a la actual',
      );
    }

    await this.guardarPassword(userId, dto.passwordNueva);
    return { mensaje: 'Contraseña actualizada' };
  }

  // El ADMIN a otro usuario: no pide la actual (caso "la olvidó")
  async restablecerPassword(
    id: string,
    dto: RestablecerPasswordDto,
    actorId: string,
  ) {
    if (id === actorId) {
      throw new BadRequestException(
        'Para tu propia contraseña usa PATCH /usuarios/me/password',
      );
    }
    await this.findOne(id);
    await this.guardarPassword(id, dto.passwordNueva);
    return { mensaje: 'Contraseña restablecida' };
  }

  private async guardarPassword(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
  }
}

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

// P2002 = violación de restricción única (email repetido)
function manejarEmailDuplicado(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Ya existe un usuario con ese email');
  }
  throw error;
}

import { IsEnum, IsOptional } from 'class-validator';
import {
  EstadoRegistroServicio,
  MetodoPago,
} from '../../generated/prisma/client';

// El DTO valida el formato; las reglas de transición viven en el service
export class CambiarEstadoDto {
  @IsEnum(EstadoRegistroServicio)
  estado!: EstadoRegistroServicio;

  // Obligatorio solo al pasar a ENTREGADO (lo exige el service)
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;
}

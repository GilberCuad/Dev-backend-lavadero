import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoVehiculo } from '../../generated/prisma/client';

// El formato de la placa se valida en el service, después de normalizarla
export class UpdateVehiculoDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  placa?: string;

  @IsOptional()
  @IsEnum(TipoVehiculo)
  tipo?: TipoVehiculo;
}

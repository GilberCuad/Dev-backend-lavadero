import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Sin precios ni total: el servidor los toma del catálogo.
// Sin tipo: se deduce de la placa (formato Colombia).
export class CreateRegistroDto {
  @IsString()
  @MaxLength(10)
  placa!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'debe incluir al menos un servicio' })
  @ArrayMaxSize(10)
  @ArrayUnique({ message: 'servicioIds no puede tener servicios repetidos' })
  @IsUUID('4', { each: true })
  servicioIds!: string[];

  // Opcional al crear: se pueden asignar después, antes de iniciar el lavado
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique({ message: 'empleadoIds no puede tener empleados repetidos' })
  @IsUUID('4', { each: true })
  empleadoIds?: string[];
}

import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  // Solo letras, números y guion (cubre CC, CE y pasaporte)
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message:
      'documento debe tener entre 5 y 20 caracteres (letras, números o guion)',
  })
  documento!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  cargo!: string;

  // Formato ISO 8601, por ejemplo "2026-10-21"
  @IsDateString()
  fechaIngreso!: string;
}

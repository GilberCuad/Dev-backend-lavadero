import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  // Decimal(10, 2) en BD: máximo 8 dígitos enteros y 2 decimales
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'precio debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'precio debe ser mayor a 0' })
  @Max(99999999.99)
  precio!: number;
}

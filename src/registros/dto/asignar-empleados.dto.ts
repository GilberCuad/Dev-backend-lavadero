import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

// Reemplaza la lista completa de empleados del registro
export class AsignarEmpleadosDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'debe incluir al menos un empleado' })
  @ArrayMaxSize(10)
  @ArrayUnique({ message: 'empleadoIds no puede tener empleados repetidos' })
  @IsUUID('4', { each: true })
  empleadoIds!: string[];
}

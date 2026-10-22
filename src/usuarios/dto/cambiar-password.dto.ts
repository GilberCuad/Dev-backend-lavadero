import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsPasswordSegura } from './password-policy';

// El propio usuario cambia su contraseña: debe demostrar que conoce la actual
export class CambiarPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  passwordActual!: string;

  @IsPasswordSegura()
  passwordNueva!: string;
}

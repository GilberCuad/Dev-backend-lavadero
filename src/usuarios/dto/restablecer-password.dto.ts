import { IsPasswordSegura } from './password-policy';

// El ADMIN asigna una contraseña nueva a otro usuario (ej. la olvidó)
export class RestablecerPasswordDto {
  @IsPasswordSegura()
  passwordNueva!: string;
}

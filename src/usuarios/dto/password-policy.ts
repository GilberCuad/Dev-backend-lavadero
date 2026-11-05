import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';

// Política: mínimo 8 caracteres, al menos una letra y un número.
// Máximo 72 porque bcrypt ignora todo lo que pase de 72 bytes.
export function IsPasswordSegura() {
  return applyDecorators(
    IsString(),
    MaxLength(72),
    Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
      message:
        'la contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número',
    }),
  );
}

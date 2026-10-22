import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Rol } from '../../generated/prisma/client';
import { IsPasswordSegura } from './password-policy';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsPasswordSegura()
  password!: string;

  @IsEnum(Rol)
  rol!: Rol;
}

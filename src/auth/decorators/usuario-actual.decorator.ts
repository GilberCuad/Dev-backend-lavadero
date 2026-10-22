import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Forma de req.user (lo que devuelve JwtStrategy.validate)
export interface UsuarioJwt {
  userId: string;
  email: string;
  rol: string;
}

// Uso: metodo(@UsuarioActual() usuario: UsuarioJwt)
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt => {
    return ctx.switchToHttp().getRequest().user;
  },
);

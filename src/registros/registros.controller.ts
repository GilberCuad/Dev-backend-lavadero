import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UsuarioActual,
  type UsuarioJwt,
} from '../auth/decorators/usuario-actual.decorator';

// Por defecto solo ADMIN; las operaciones del día a día se abren al OPERARIO
@Controller('registros')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RegistrosController {
  constructor(private registrosService: RegistrosService) {}

  @Post()
  @Roles('ADMIN', 'OPERARIO')
  create(
    @Body() dto: CreateRegistroDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    // createdBy sale del JWT, jamás del body
    return this.registrosService.create(dto, usuario.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERARIO')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrosService.findOne(id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UsuarioActual,
  type UsuarioJwt,
} from '../auth/decorators/usuario-actual.decorator';

// Por defecto solo ADMIN; las lecturas se abren a ambos roles a nivel de método
@Controller('servicios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ServiciosController {
  constructor(private serviciosService: ServiciosService) {}

  @Get()
  @Roles('ADMIN', 'OPERARIO')
  findAll(@UsuarioActual() usuario: UsuarioJwt) {
    return this.serviciosService.findAll(usuario.rol !== 'ADMIN');
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERARIO')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.serviciosService.findOne(id, usuario.rol !== 'ADMIN');
  }

  @Post()
  create(@Body() dto: CreateServicioDto) {
    return this.serviciosService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServicioDto,
  ) {
    return this.serviciosService.update(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviciosService.cambiarEstado(id, false);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviciosService.cambiarEstado(id, true);
  }
}

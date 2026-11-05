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
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EstadoEmpleado } from '../generated/prisma/client';

// Todo el controller exige token; los métodos sin @Roles los ve cualquier rol
@Controller('empleados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpleadosController {
  constructor(private empleadosService: EmpleadosService) {}

  @Get()
  findAll() {
    return this.empleadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.empleadosService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateEmpleadoDto) {
    return this.empleadosService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmpleadoDto,
  ) {
    return this.empleadosService.update(id, dto);
  }

  @Patch(':id/desactivar')
  @Roles('ADMIN')
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.empleadosService.cambiarEstado(id, EstadoEmpleado.INACTIVO);
  }

  @Patch(':id/activar')
  @Roles('ADMIN')
  activar(@Param('id', ParseUUIDPipe) id: string) {
    return this.empleadosService.cambiarEstado(id, EstadoEmpleado.ACTIVO);
  }
}

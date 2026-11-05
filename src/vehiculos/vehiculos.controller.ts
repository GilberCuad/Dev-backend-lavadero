import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Sin POST: los vehículos se crean al registrar un ingreso (Fase 2.5)
@Controller('vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class VehiculosController {
  constructor(private vehiculosService: VehiculosService) {}

  @Get()
  @Roles('ADMIN', 'OPERARIO')
  findAll(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
  ) {
    return this.vehiculosService.findAll(pagina, limite);
  }

  // Ruta fija antes de /:id
  @Get('placa/:placa')
  @Roles('ADMIN', 'OPERARIO')
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERARIO')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, dto);
  }
}

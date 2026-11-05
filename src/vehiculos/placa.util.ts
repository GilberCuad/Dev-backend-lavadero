import { BadRequestException } from '@nestjs/common';
import { TipoVehiculo } from '../generated/prisma/client';

// Formato Colombia: carro ABC123; moto ABC12D (o ABC12 en placas antiguas)
const FORMATO_CARRO = /^[A-Z]{3}\d{3}$/;
const FORMATO_MOTO = /^[A-Z]{3}\d{2}[A-Z]?$/;

// " abc-123 " → "ABC123"
export function normalizarPlaca(placa: string) {
  return placa.toUpperCase().replace(/[\s-]/g, '');
}

export function tipoSegunPlaca(placa: string): TipoVehiculo | null {
  if (FORMATO_CARRO.test(placa)) return TipoVehiculo.CARRO;
  if (FORMATO_MOTO.test(placa)) return TipoVehiculo.MOTO;
  return null;
}

// Normaliza la placa y, si se indica tipo, exige que coincida con el formato
export function validarPlaca(placa: string, tipo?: TipoVehiculo) {
  const normalizada = normalizarPlaca(placa);
  const tipoDetectado = tipoSegunPlaca(normalizada);

  if (!tipoDetectado) {
    throw new BadRequestException(
      'Placa inválida: use ABC123 para carro o ABC12D / ABC12 para moto',
    );
  }
  if (tipo && tipo !== tipoDetectado) {
    throw new BadRequestException(
      `La placa ${normalizada} corresponde a ${tipoDetectado}, no a ${tipo}`,
    );
  }
  return normalizada;
}

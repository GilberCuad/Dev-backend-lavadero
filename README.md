# Lavadero Backend

API REST para la gestión de un lavadero de carros y motos: ingreso de vehículos, servicios aplicados, empleados, pagos y estadísticas. Hecha con **NestJS + Prisma 7 + PostgreSQL**, con autenticación JWT y dos roles (`ADMIN` y `OPERARIO`).

> Proyecto en desarrollo activo (rama `calidad`). El frontend (React + Vite) aún no está iniciado.

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime / framework | Node.js 22 + NestJS 11 + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma 7 con `@prisma/adapter-pg` (cliente generado en `src/generated/prisma`) |
| Autenticación | JWT (`@nestjs/jwt`, `passport-jwt`) + `bcrypt` |
| Validación | `class-validator` + `class-transformer` |
| Rate limiting | `@nestjs/throttler` |

---

## Puesta en marcha

### 1. Requisitos
- Node.js 22+ y npm.
- PostgreSQL con una base de datos y un usuario con permiso `CREATEDB` (Prisma Migrate necesita crear una *shadow database*).

### 2. Variables de entorno
Copia `.env.example` a `.env` y completa los valores. **`.env` nunca se sube al repositorio.**

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. La contraseña no debe contener caracteres especiales de URL (`/ @ : # ?`) o debe ir codificada. |
| `SEED_ADMIN_EMAIL` | Email del administrador inicial (en minúsculas). |
| `SEED_ADMIN_PASSWORD` | Contraseña del administrador inicial. |
| `JWT_SECRET` | Cadena larga y aleatoria para firmar los tokens. |
| `JWT_EXPIRES_IN` | Duración del token (ej. `8h`). |
| `FRONTEND_URL` | Origen permitido por CORS (ej. `http://localhost:5173`). |

### 3. Instalación, base de datos y arranque
```bash
npm install
npx prisma migrate dev     # aplica las migraciones (en producción: npx prisma migrate deploy)
npx prisma generate        # genera el cliente de Prisma (en Prisma 7 migrate NO lo hace solo)
npx prisma db seed         # crea el usuario ADMIN inicial
npm run start:dev          # http://localhost:3000
```

> ⚠️ **Prisma 7:** después de cada migración hay que correr `npx prisma generate`. Si no, el cliente queda desactualizado aunque el código compile.
>
> El seed solo crea el admin si no existe: cambiar `SEED_ADMIN_PASSWORD` después **no** actualiza la contraseña de un admin ya creado.

---

## Roles

| Rol | Puede |
|---|---|
| `ADMIN` | Todo: usuarios, empleados, catálogo de servicios, corrección de vehículos, registros, (próximamente) pagos, balance y estadísticas. |
| `OPERARIO` | Registrar ingresos, consultar servicios activos, empleados y vehículos, ver su perfil y cambiar su contraseña. |

---

## Endpoints

Todas las rutas, salvo el login, requieren `Authorization: Bearer <access_token>`.

### Auth
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público (5 intentos/min) | Devuelve `access_token` y los datos básicos del usuario. |

### Usuarios
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/usuarios/me` | Ambos roles |
| PATCH | `/usuarios/me/password` | Ambos roles (requiere la contraseña actual; 5/min) |
| GET | `/usuarios`, `/usuarios/:id` | ADMIN |
| POST | `/usuarios` | ADMIN |
| PATCH | `/usuarios/:id` | ADMIN |
| PATCH | `/usuarios/:id/password` | ADMIN (restablecer la contraseña de otro usuario) |
| PATCH | `/usuarios/:id/activar`, `/usuarios/:id/desactivar` | ADMIN |

### Empleados
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/empleados`, `/empleados/:id` | Ambos roles |
| POST | `/empleados` | ADMIN |
| PATCH | `/empleados/:id` | ADMIN |
| PATCH | `/empleados/:id/activar`, `/empleados/:id/desactivar` | ADMIN |

### Servicios (catálogo)
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/servicios`, `/servicios/:id` | Ambos roles (el OPERARIO solo ve los activos) |
| POST | `/servicios` | ADMIN |
| PATCH | `/servicios/:id` | ADMIN |
| PATCH | `/servicios/:id/activar`, `/servicios/:id/desactivar` | ADMIN |

### Vehículos
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/vehiculos?pagina=1&limite=20` | Ambos roles (paginado, máximo 100 por página) |
| GET | `/vehiculos/placa/:placa` | Ambos roles |
| GET | `/vehiculos/:id` | Ambos roles |
| PATCH | `/vehiculos/:id` | ADMIN (corregir placa y/o tipo) |

Los vehículos no tienen `POST`: se crean automáticamente al registrar un ingreso.

### Registros de servicio (en desarrollo)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/registros` | Ambos roles | Registra el ingreso de un vehículo. Body: `{ placa, servicioIds, empleadoIds? }` |
| GET | `/registros/:id` | Ambos roles | Detalle con vehículo, servicios, empleados y usuario creador. |

Próximamente: asignar empleados, cambiar de estado y listados con filtros.

---

## Reglas de negocio

- **Placas en formato Colombia**, normalizadas (mayúsculas, sin espacios ni guiones): carro `ABC123`; moto `ABC12D` o `ABC12`. El tipo de vehículo se **deduce de la placa**.
- **Un vehículo por placa**: se reutiliza en cada ingreso. Un vehículo no puede tener dos servicios abiertos a la vez (responde `409`).
- **El precio lo pone el servidor**: el cliente nunca envía precios ni totales. Cada servicio guarda su `precioAplicado` (el precio congelado en ese momento) y el registro guarda el `total` como snapshot; si después cambia el catálogo, el histórico no se altera.
- **Ingreso atómico**: crear un ingreso (vehículo, registro, servicios y empleados) ocurre en una sola transacción; si algo falla, no queda nada a medias.
- **Estados del registro**: `EN_ESPERA → EN_PROCESO → TERMINADO → ENTREGADO`, más `CANCELADO` (solo desde `EN_ESPERA` o `EN_PROCESO`). Pasar a `EN_PROCESO` exige al menos un empleado; `ENTREGADO` exige el método de pago (el cliente paga al recoger).
- **Sin borrado físico**: usuarios, empleados y servicios se activan o desactivan para conservar el historial.
- Los montos usan `Decimal(10, 2)` y en las respuestas JSON llegan como **texto** (ej. `"18000"`).

---

## Seguridad

- Validación estricta de toda entrada (`ValidationPipe` con `whitelist` y `forbidNonWhitelisted`): un campo no declarado responde `400`.
- Ids de ruta validados como UUID (`ParseUUIDPipe`).
- Autorización por rol en cada endpoint, restringida a `ADMIN` por defecto.
- Contraseñas con bcrypt y política mínima (8+ caracteres, letra y número; máximo 72). El hash nunca se devuelve.
- Revocación inmediata: en cada petición se verifica que el usuario siga activo y con su rol vigente.
- El usuario que crea un registro se toma del JWT, nunca del body.
- Rate limiting global (20 peticiones/min) y más estricto en el login y en el cambio de contraseña.
- Mensajes de error genéricos (el login no revela si un email existe).

---

## Estructura

```
prisma/
  schema.prisma        modelo de datos (8 tablas)
  migrations/          migraciones versionadas
  seed.ts              usuario ADMIN inicial
src/
  auth/                login, JWT, guards de rol, decoradores @Roles y @UsuarioActual
  usuarios/            gestión de usuarios y contraseñas
  empleados/           gestión de empleados
  servicios/           catálogo de servicios
  vehiculos/           vehículos y validación de placas (placa.util.ts)
  registros/           ingresos de vehículos y servicios aplicados
  prisma/              PrismaService (módulo global)
```

---

## Hoja de ruta

- [x] Autenticación y roles
- [x] Usuarios, empleados, catálogo de servicios, vehículos
- [ ] Registros de servicio: ✅ creación y consulta · ⏳ asignar empleados, cambio de estado, listados con filtros
- [ ] Pagos a empleados
- [ ] Balance y estadísticas (vehículos y dinero por mes)
- [ ] Pruebas automatizadas (Jest unitarias + e2e con Supertest)
- [ ] Frontend (React + TypeScript + Vite)
- [ ] Pruebas E2E (Playwright) y despliegue

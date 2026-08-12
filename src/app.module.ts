import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  ThrottlerModule.forRoot([
    {
      ttl: 60000,
      limit: 20,
    }
  ]),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: 'APP_GUARD',
    useClass: ThrottlerGuard,
  },
  ],
})
export class AppModule { }

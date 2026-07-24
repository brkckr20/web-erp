import { Module } from '@nestjs/common'
import { KumasGrupController } from './kumas-grup.controller'
import { KumasGrupService } from './kumas-grup.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [KumasGrupController],
  providers: [KumasGrupService],
})
export class KumasGrupModule {}

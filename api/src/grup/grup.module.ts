import { Module } from '@nestjs/common'
import { GrupController } from './grup.controller'
import { GrupService } from './grup.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [GrupController],
  providers: [GrupService],
})
export class GrupModule {}

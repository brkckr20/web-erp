import { Module } from '@nestjs/common'
import { MarkaController } from './marka.controller'
import { MarkaService } from './marka.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [MarkaController],
  providers: [MarkaService],
})
export class MarkaModule {}

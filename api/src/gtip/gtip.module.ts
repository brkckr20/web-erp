import { Module } from '@nestjs/common'
import { GtipController } from './gtip.controller'
import { GtipService } from './gtip.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [GtipController],
  providers: [GtipService],
})
export class GtipModule {}

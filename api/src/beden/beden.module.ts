import { Module } from '@nestjs/common'
import { BedenController } from './beden.controller'
import { BedenService } from './beden.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [BedenController],
  providers: [BedenService],
})
export class BedenModule {}

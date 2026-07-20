import { Module } from '@nestjs/common'
import { RaporController } from './rapor.controller'
import { RaporService } from './rapor.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [RaporController],
  providers: [RaporService, PrismaService],
})
export class RaporModule {}

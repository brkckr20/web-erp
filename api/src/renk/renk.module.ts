import { Module } from '@nestjs/common'
import { RenkService } from './renk.service'
import { RenkController } from './renk.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [RenkController],
  providers: [RenkService, PrismaService],
})
export class RenkModule {}
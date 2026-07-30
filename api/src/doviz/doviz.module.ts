import { Module } from '@nestjs/common'
import { DovizService } from './doviz.service'
import { DovizController } from './doviz.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [DovizController],
  providers: [DovizService, PrismaService],
})
export class DovizModule {}

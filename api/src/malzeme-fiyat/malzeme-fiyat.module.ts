import { Module } from '@nestjs/common'
import { MalzemeFiyatService } from './malzeme-fiyat.service'
import { MalzemeFiyatController } from './malzeme-fiyat.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [MalzemeFiyatController],
  providers: [MalzemeFiyatService, PrismaService],
})
export class MalzemeFiyatModule {}

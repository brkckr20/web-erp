import { Module } from '@nestjs/common'
import { MalzemeController } from './malzeme.controller'
import { MalzemeService } from './malzeme.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [MalzemeController],
  providers: [MalzemeService],
})
export class MalzemeModule {}

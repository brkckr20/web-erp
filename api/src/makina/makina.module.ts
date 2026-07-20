import { Module } from '@nestjs/common'
import { MakinaController } from './makina.controller'
import { MakinaService } from './makina.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [MakinaController],
  providers: [MakinaService],
})
export class MakinaModule {}

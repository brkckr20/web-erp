import { Module } from '@nestjs/common'
import { SablonController } from './sablon.controller'
import { SablonService } from './sablon.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SablonController],
  providers: [SablonService],
})
export class SablonModule {}

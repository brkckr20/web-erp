import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OzellikKodlamaService } from './ozellik-kodlama.service'
import { OzellikKodlamaController } from './ozellik-kodlama.controller'

@Module({
  imports: [PrismaModule],
  controllers: [OzellikKodlamaController],
  providers: [OzellikKodlamaService],
})
export class OzellikKodlamaModule {}

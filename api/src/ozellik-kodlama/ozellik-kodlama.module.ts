import { Module } from '@nestjs/common'
import { OzellikKodlamaService } from './ozellik-kodlama.service'
import { OzellikKodlamaController } from './ozellik-kodlama.controller'

@Module({
  controllers: [OzellikKodlamaController],
  providers: [OzellikKodlamaService],
})
export class OzellikKodlamaModule {}

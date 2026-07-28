import { Module } from '@nestjs/common'
import { MalzemeEkController } from './malzeme-ek.controller'
import { MalzemeEkService } from './malzeme-ek.service'

@Module({
  controllers: [MalzemeEkController],
  providers: [MalzemeEkService],
})
export class MalzemeEkModule {}
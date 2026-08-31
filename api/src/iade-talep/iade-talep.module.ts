import { Module } from '@nestjs/common'
import { IadeTalepController } from './iade-talep.controller'
import { IadeTalepService } from './iade-talep.service'

@Module({
  controllers: [IadeTalepController],
  providers: [IadeTalepService],
  exports: [IadeTalepService],
})
export class IadeTalepModule {}

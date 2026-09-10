import { Module } from '@nestjs/common'
import { HizmetTalepService } from './hizmet-talep.service'
import { HizmetTalepController } from './hizmet-talep.controller'

@Module({
  providers: [HizmetTalepService],
  controllers: [HizmetTalepController],
})
export class HizmetTalepModule {}

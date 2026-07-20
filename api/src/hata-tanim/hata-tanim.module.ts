import { Module } from '@nestjs/common'
import { HataTanimController } from './hata-tanim.controller'
import { HataTanimService } from './hata-tanim.service'

@Module({
  controllers: [HataTanimController],
  providers: [HataTanimService],
})
export class HataTanimModule {}

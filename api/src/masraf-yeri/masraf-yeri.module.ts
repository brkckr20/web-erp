import { Module } from '@nestjs/common'
import { MasrafYeriController } from './masraf-yeri.controller'
import { MasrafYeriService } from './masraf-yeri.service'

@Module({
  controllers: [MasrafYeriController],
  providers: [MasrafYeriService],
})
export class MasrafYeriModule {}
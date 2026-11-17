import { Module } from '@nestjs/common'
import { NakliyeciController } from './nakliyeci.controller'
import { NakliyeciService } from './nakliyeci.service'

@Module({
  controllers: [NakliyeciController],
  providers: [NakliyeciService],
})
export class NakliyeciModule {}

import { Module } from '@nestjs/common'
import { FormSabloniController } from './form-sabloni.controller'
import { FormSabloniService } from './form-sabloni.service'

@Module({
  controllers: [FormSabloniController],
  providers: [FormSabloniService],
})
export class FormSabloniModule {}

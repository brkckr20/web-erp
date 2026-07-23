import { Module } from '@nestjs/common'
import { ModelBedenController } from './model-beden.controller'
import { ModelBedenService } from './model-beden.service'

@Module({
  controllers: [ModelBedenController],
  providers: [ModelBedenService],
  exports: [ModelBedenService],
})
export class ModelBedenModule {}

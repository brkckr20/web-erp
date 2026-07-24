import { Module } from '@nestjs/common'
import { ModelKumasGrupController } from './model-kumas-grup.controller'
import { ModelKumasGrupService } from './model-kumas-grup.service'

@Module({
  controllers: [ModelKumasGrupController],
  providers: [ModelKumasGrupService],
  exports: [ModelKumasGrupService],
})
export class ModelKumasGrupModule {}

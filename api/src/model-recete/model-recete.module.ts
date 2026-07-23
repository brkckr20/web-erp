import { Module } from '@nestjs/common'
import { ModelReceteController } from './model-recete.controller'
import { ModelReceteService } from './model-recete.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ModelReceteController],
  providers: [ModelReceteService],
})
export class ModelReceteModule {}

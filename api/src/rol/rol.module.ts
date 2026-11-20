import { Module } from '@nestjs/common'
import { RolController } from './rol.controller'
import { RolService } from './rol.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [RolController],
  providers: [RolService],
})
export class RolModule {}

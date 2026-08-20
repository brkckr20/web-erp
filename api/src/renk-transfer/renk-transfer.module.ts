import { Module } from '@nestjs/common'
import { RenkTransferService } from './renk-transfer.service'
import { RenkTransferController } from './renk-transfer.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [RenkTransferController],
  providers: [RenkTransferService, PrismaService],
})
export class RenkTransferModule {}
import { Module } from '@nestjs/common'
import { CariTransferService } from './cari-transfer.service'
import { CariTransferController } from './cari-transfer.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CariTransferController],
  providers: [CariTransferService, PrismaService],
})
export class CariTransferModule {}
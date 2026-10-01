import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { FaturaService } from './fatura.service'
import { CreateFaturaDto } from './dto/create-fatura.dto'
import { UpdateFaturaDto } from './dto/create-fatura.dto'

@Controller('fatura')
export class FaturaController {
  constructor(private readonly service: FaturaService) {}

  @Get('next-fatura-no')
  nextFaturaNo(@Query('faturaTipi') faturaTipi: string) {
    return this.service.nextFaturaNo(faturaTipi)
  }

  @Get('baglanabilir-irsaliyeler')
  baglanabilirIrsaliyeler(@Query('cariHesapId') cariHesapId?: string) {
    return this.service.baglanabilirIrsaliyeler(
      cariHesapId ? parseInt(cariHesapId, 10) : undefined,
    )
  }

  @Get()
  findAll(@Query('faturaTipi') faturaTipi?: string) {
    return this.service.findAll(faturaTipi)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateFaturaDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaturaDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}

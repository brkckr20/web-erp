import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SiparisService } from './siparis.service';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { UpdateSiparisDto } from './dto/create-siparis.dto';

@Controller('siparis')
export class SiparisController {
  constructor(private readonly service: SiparisService) {}

  @Get('next-no')
  nextSiparisNo(@Query('numaratorId', ParseIntPipe) numaratorId: number) {
    return this.service.nextSiparisNo(numaratorId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSiparisDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSiparisDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { NakliyeciService } from './nakliyeci.service'
import { CreateNakliyeciDto } from './dto/create-nakliyeci.dto'
import { UpdateNakliyeciDto } from './dto/update-nakliyeci.dto'

@Controller('nakliyeci')
export class NakliyeciController {
  constructor(private readonly nakliyeciService: NakliyeciService) {}

  @Get()
  findAll() {
    return this.nakliyeciService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nakliyeciService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateNakliyeciDto) {
    return this.nakliyeciService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNakliyeciDto) {
    return this.nakliyeciService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nakliyeciService.remove(id)
  }
}

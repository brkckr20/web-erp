import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { DovizService } from './doviz.service'
import { CreateDovizDto } from './dto/create-doviz.dto'
import { UpdateDovizDto } from './dto/update-doviz.dto'

@Controller('doviz')
export class DovizController {
  constructor(private readonly dovizService: DovizService) {}

  @Get()
  findAll() {
    return this.dovizService.findAll()
  }

  @Get(':kod')
  findOne(@Param('kod') kod: string) {
    return this.dovizService.findOne(kod)
  }

  @Post()
  create(@Body() dto: CreateDovizDto) {
    return this.dovizService.create(dto)
  }

  @Put(':kod')
  update(@Param('kod') kod: string, @Body() dto: UpdateDovizDto) {
    return this.dovizService.update(kod, dto)
  }

  @Delete(':kod')
  remove(@Param('kod') kod: string) {
    return this.dovizService.remove(kod)
  }
}

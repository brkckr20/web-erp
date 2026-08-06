import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Query } from '@nestjs/common'
import { FormSabloniService } from './form-sabloni.service'
import { CreateFormSabloniDto } from './dto/create-form-sabloni.dto'
import { UpdateFormSabloniDto } from './dto/update-form-sabloni.dto'
import { CreateSorguTestDto } from './dto/create-sorgu-test.dto'

@Controller('form-sabloni')
export class FormSabloniController {
  constructor(private readonly formSabloniService: FormSabloniService) {}

  @Get()
  findAll(@Query('ekranTuru') ekranTuru?: string) {
    return this.formSabloniService.findAll(ekranTuru)
  }

  @Post('sorgu-test')
  sorguTest(@Body() dto: CreateSorguTestDto) {
    return this.formSabloniService.sorguTest(dto.sorguMetni, dto.parametreler ?? {})
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formSabloniService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateFormSabloniDto) {
    return this.formSabloniService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFormSabloniDto) {
    return this.formSabloniService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formSabloniService.remove(id)
  }
}

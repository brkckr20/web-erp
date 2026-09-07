import { Controller, Get, Post, Put, Delete, Param, Body, Query, Res } from '@nestjs/common'
import { SablonService } from './sablon.service'
import type { Response } from 'express'

@Controller('sablon')
export class SablonController {
  constructor(private readonly service: SablonService) {}

  @Get()
  list(@Query('ekranAdi') ekranAdi?: string) {
    return this.service.listele(ekranAdi)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getir(Number(id))
  }

  @Post()
  create(@Body() body: any) {
    return this.service.olustur(body)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.guncelle(Number(id), body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.sil(Number(id))
  }

  @Post('sorgu-calistir')
  sorguCalistir(@Body() body: { sql: string; parametreler?: Record<string, any> }) {
    return this.service.sorguCalistir(body.sql, body.parametreler)
  }

  @Post(':id/onerizleme')
  onerizle(@Param('id') id: string, @Body() body: { parametreler?: Record<string, any> }) {
    return this.service.onerizle(Number(id), body.parametreler)
  }

  @Post(':id/pdf')
  async pdf(@Param('id') id: string, @Body() body: { parametreler?: Record<string, any> }, @Res() res: Response) {
    const pdfBuffer = await this.service.pdfOlustur(Number(id), body.parametreler)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=sablon-${id}.pdf`)
    res.end(pdfBuffer)
  }
}

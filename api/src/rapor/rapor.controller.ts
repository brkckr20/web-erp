import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common'
import { RaporService } from './rapor.service'

@Controller('rapor')
export class RaporController {
  constructor(private readonly service: RaporService) {}

  @Get('depo-bazli-stok')
  depoBazliStok() {
    return this.service.depoBazliStok()
  }

  @Get('html-templates')
  listHtmlTemplates(@Query('ekranTuru') ekranTuru?: string) {
    return this.service.listHtmlTemplates(ekranTuru)
  }

  @Post('html-templates')
  createHtmlTemplate(@Body() body: {
    id: string; ad: string; ekranTuru: string; aciklama?: string;
    sayfaBoyut: string; sayfaYon: string; genislik: number; yukseklik: number;
  }) {
    return this.service.createHtmlTemplate(body)
  }

  @Get('html-template/:id')
  getHtmlTemplate(@Param('id') id: string) {
    return this.service.getHtmlTemplate(id)
  }

  @Post('html-template-data')
  getHtmlTemplateData(@Body() body: { templateId: string; kayitId: number }) {
    return this.service.getHtmlTemplateData(body.templateId, body.kayitId)
  }

  @Put('html-template/:id')
  updateHtmlTemplate(@Param('id') id: string, @Body() body: { html: string }) {
    return this.service.updateHtmlTemplate(id, body.html)
  }

  @Put('html-template/:id/queries')
  updateHtmlTemplateQueries(
    @Param('id') id: string,
    @Body() body: { sorgular: Array<{ sirano: number; ad: string; sorguMetni: string }> },
  ) {
    return this.service.updateHtmlTemplateQueries(id, body.sorgular)
  }
}

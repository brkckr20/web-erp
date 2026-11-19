<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  exclude-result-prefixes="n1 cac cbc">

  <xsl:output method="html" encoding="UTF-8" indent="no"/>
  <xsl:decimal-format name="tr" decimal-separator="," grouping-separator="."/>
  <xsl:key name="Birim" match="n1:DespatchAdvice/cac:DespatchLine" use="cbc:DeliveredQuantity/@unitCode"/>

  <!-- Birim etiketi -->
  <xsl:template name="BirimAd">
    <xsl:param name="kod"/>
    <xsl:choose>
      <xsl:when test="$kod='KGM'">KG</xsl:when>
      <xsl:when test="$kod='MTR'">MT</xsl:when>
      <xsl:when test="$kod='TNE'">TON</xsl:when>
      <xsl:when test="$kod='LTR'">LT</xsl:when>
      <xsl:when test="$kod='C62'">ADET</xsl:when>
      <xsl:when test="$kod='NAR'">ADET</xsl:when>
      <xsl:otherwise><xsl:value-of select="$kod"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Adres metni -->
  <xsl:template name="Adres">
    <xsl:param name="adres"/>
    <xsl:if test="$adres">
      <xsl:if test="$adres/cbc:StreetName">
        <div><xsl:value-of select="$adres/cbc:StreetName"/></div>
      </xsl:if>
      <div>
        <xsl:if test="$adres/cbc:CitySubdivisionName">
          <xsl:value-of select="$adres/cbc:CitySubdivisionName"/>
          <xsl:text> / </xsl:text>
        </xsl:if>
        <xsl:value-of select="$adres/cbc:CityName"/>
        <xsl:if test="$adres/cbc:PostalZone">
          <xsl:text> - </xsl:text>
          <xsl:value-of select="$adres/cbc:PostalZone"/>
        </xsl:if>
      </div>
      <xsl:if test="$adres/cac:Country/cbc:Name">
        <div><xsl:value-of select="$adres/cac:Country/cbc:Name"/></div>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/">
    <div class="gib-irsaliye">
      <style type="text/css">
        @page { size: A4; margin: 8mm; }
        .gib-irsaliye { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; width: 100%; max-width: 194mm; margin: 0 auto; background: #fff; }
        .gib-irsaliye table { border-collapse: collapse; width: 100%; }
        .gib-irsaliye .head-table td { vertical-align: top; padding: 0; }
        .gib-irsaliye .firma-unvan { font-size: 14px; font-weight: bold; }
        .gib-irsaliye .logo-box { border: 1px dashed #999; width: 62mm; height: 20mm; text-align: center; color: #999; font-size: 9px; line-height: 20mm; }
        .gib-irsaliye .qr-wrap { text-align: center; margin-top: 2mm; }
        .gib-irsaliye .qr-wrap canvas { width: 26mm; height: 26mm; }
        .gib-irsaliye .qr-caption { font-size: 7.5px; color: #444; }
        .gib-irsaliye .belge-baslik { border-top: 2px solid #000; border-bottom: 2px solid #000; text-align: center; font-size: 15px; font-weight: bold; letter-spacing: 2px; padding: 2mm 0; margin: 2mm 0 3mm 0; }
        .gib-irsaliye .kunye td { border: 1px solid #666; padding: 1.2mm 2mm; }
        .gib-irsaliye .kunye .etiket { background: #f0f0f0; font-weight: bold; width: 26mm; white-space: nowrap; }
        .gib-irsaliye .blok-baslik { font-weight: bold; font-size: 9px; text-transform: uppercase; color: #333; margin: 3mm 0 1mm 0; }
        .gib-irsaliye .parti-kutu { border: 1px solid #666; padding: 2mm; }
        .gib-irsaliye .parti-unvan { font-size: 12px; font-weight: bold; }
        .gib-irsaliye .kalem { margin-top: 3mm; }
        .gib-irsaliye .kalem th { border: 1px solid #666; background: #e6e6e6; padding: 1.2mm 1.5mm; font-size: 9px; text-align: left; }
        .gib-irsaliye .kalem td { border: 1px solid #999; padding: 1.2mm 1.5mm; vertical-align: top; }
        .gib-irsaliye .kalem .sag { text-align: right; }
        .gib-irsaliye .kalem .orta { text-align: center; }
        .gib-irsaliye .kalem tfoot td { font-weight: bold; background: #f5f5f5; }
        .gib-irsaliye .nakliye { margin-top: 3mm; }
        .gib-irsaliye .nakliye td { border: 1px solid #999; padding: 1.2mm 2mm; }
        .gib-irsaliye .nakliye .etiket { background: #f0f0f0; font-weight: bold; width: 24mm; }
        .gib-irsaliye .imza { margin-top: 6mm; }
        .gib-irsaliye .imza td { border: 1px solid #666; height: 24mm; vertical-align: bottom; text-align: center; font-size: 9px; padding: 1.5mm; width: 33.33%; }
        .gib-irsaliye .dipnot { margin-top: 3mm; font-size: 7.5px; color: #444; text-align: center; line-height: 1.5; }
        @media print {
          .gib-irsaliye { width: auto; }
          .gib-irsaliye .kalem tr { page-break-inside: avoid; }
        }
      </style>

      <xsl:for-each select="n1:DespatchAdvice">
        <xsl:variable name="sat" select="cac:DespatchSupplierParty/cac:Party"/>
        <xsl:variable name="alc" select="cac:DeliveryCustomerParty/cac:Party"/>
        <xsl:variable name="asamasi" select="cac:Shipment/cac:ShipmentStage"/>
        <xsl:variable name="nakliye" select="$asamasi/cac:CarrierParty"/>
        <xsl:variable name="plaka" select="$asamasi/cac:TransportMeans/cac:RoadTransport/cbc:LicensePlateID"/>
        <xsl:variable name="satAdres" select="$sat/cac:PartyLegalEntity/cac:PostalAddress"/>
        <xsl:variable name="alcAdres" select="$alc/cac:PartyLegalEntity/cac:PostalAddress"/>
        <xsl:variable name="qr"
          select="concat(
            '{&quot;vkntckn&quot;:&quot;', $sat/cac:PartyIdentification/cbc:ID,
            '&quot;,&quot;avkntckn&quot;:&quot;', $alc/cac:PartyIdentification/cbc:ID,
            '&quot;,&quot;senaryo&quot;:&quot;', cbc:ProfileID,
            '&quot;,&quot;tip&quot;:&quot;', cbc:DespatchAdviceTypeCode,
            '&quot;,&quot;tarih&quot;:&quot;', cbc:IssueDate,
            '&quot;,&quot;no&quot;:&quot;', cbc:ID,
            '&quot;,&quot;ettn&quot;:&quot;', cbc:UUID,
            '&quot;,&quot;sevktarihi&quot;:&quot;', cbc:IssueDate,
            '&quot;,&quot;sevkzamani&quot;:&quot;', cbc:IssueTime,
            '&quot;,&quot;tasiyicivkn&quot;:&quot;', $nakliye/cac:Person/cbc:NationalID,
            '&quot;,&quot;plaka&quot;:&quot;', $plaka,
            '&quot;}')"/>

        <!-- Başlık: firma + logo + karekod -->
        <table class="head-table">
          <tr>
            <td style="width: 62%;">
              <div class="firma-unvan">
                <xsl:choose>
                  <xsl:when test="$sat/cac:PartyName/cbc:Name">
                    <xsl:value-of select="$sat/cac:PartyName/cbc:Name"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$sat/cac:PartyLegalEntity/cbc:RegistrationName"/>
                  </xsl:otherwise>
                </xsl:choose>
              </div>
              <div style="margin-top: 1.5mm;">
                <xsl:call-template name="Adres">
                  <xsl:with-param name="adres" select="$satAdres"/>
                </xsl:call-template>
              </div>
              <div style="margin-top: 1.5mm;">
                <b>VKN/TCKN: </b>
                <xsl:value-of select="$sat/cac:PartyIdentification/cbc:ID"/>
              </div>
            </td>
            <td style="width: 38%;" align="right">
              <div class="logo-box">FİRMA LOGO</div>
              <div class="qr-wrap">
                <canvas class="gib-qr" data-qr="{$qr}"></canvas>
                <div class="qr-caption">e-İrsaliye Doğrulama Karekodu</div>
              </div>
            </td>
          </tr>
        </table>

        <div class="belge-baslik">e-İRSALİYE</div>

        <!-- Künye -->
        <table class="kunye">
          <tr>
            <td class="etiket">İrsaliye No</td>
            <td><b><xsl:value-of select="cbc:ID"/></b></td>
            <td class="etiket">ETTN</td>
            <td><xsl:value-of select="cbc:UUID"/></td>
          </tr>
          <tr>
            <td class="etiket">Düzenleme Tarihi</td>
            <td><xsl:value-of select="concat(substring(cbc:IssueDate,9,2),'.',substring(cbc:IssueDate,6,2),'.',substring(cbc:IssueDate,1,4))"/></td>
            <td class="etiket">Düzenleme Saati</td>
            <td><xsl:value-of select="cbc:IssueTime"/></td>
          </tr>
          <tr>
            <td class="etiket">Senaryo</td>
            <td><xsl:value-of select="cbc:ProfileID"/></td>
            <td class="etiket">Belge Tipi</td>
            <td>
              <xsl:choose>
                <xsl:when test="cbc:DespatchAdviceTypeCode='SEVK'">SEVK (Sevk İrsaliyesi)</xsl:when>
                <xsl:otherwise><xsl:value-of select="cbc:DespatchAdviceTypeCode"/></xsl:otherwise>
              </xsl:choose>
            </td>
          </tr>
          <tr>
            <td class="etiket">Sevk No</td>
            <td>
              <xsl:choose>
                <xsl:when test="cac:OrderReference/cbc:ID">
                  <xsl:value-of select="cac:OrderReference/cbc:ID"/>
                </xsl:when>
                <xsl:otherwise>-</xsl:otherwise>
              </xsl:choose>
            </td>
            <td class="etiket">Kalem Sayısı</td>
            <td><xsl:value-of select="count(cac:DespatchLine)"/></td>
          </tr>
          <xsl:if test="cbc:Note">
            <tr>
              <td class="etiket">Açıklama</td>
              <td colspan="3"><xsl:value-of select="cbc:Note"/></td>
            </tr>
          </xsl:if>
        </table>

        <!-- Alıcı -->
        <div class="blok-baslik">Sayın (Alıcı)</div>
        <div class="parti-kutu">
          <div class="parti-unvan">
            <xsl:choose>
              <xsl:when test="$alc/cac:PartyLegalEntity/cbc:RegistrationName">
                <xsl:value-of select="$alc/cac:PartyLegalEntity/cbc:RegistrationName"/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$alc/cac:PartyName/cbc:Name"/>
              </xsl:otherwise>
            </xsl:choose>
          </div>
          <table style="margin-top: 1.5mm;">
            <tr>
              <td style="width: 65%; vertical-align: top;">
                <xsl:call-template name="Adres">
                  <xsl:with-param name="adres" select="$alcAdres"/>
                </xsl:call-template>
              </td>
              <td style="vertical-align: top;">
                <b>VKN/TCKN: </b>
                <xsl:value-of select="$alc/cac:PartyIdentification/cbc:ID"/>
              </td>
            </tr>
          </table>
        </div>

        <!-- Kalemler -->
        <table class="kalem">
          <thead>
            <tr>
              <th style="width: 8mm;" class="orta">Sıra</th>
              <th style="width: 24mm;">Malzeme Kodu</th>
              <th style="width: 48mm;">Malzeme Adı</th>
              <th style="width: 52mm;">Açıklama</th>
              <th style="width: 20mm;">Renk</th>
              <th style="width: 20mm;" class="sag">Miktar</th>
              <th style="width: 14mm;" class="orta">Birim</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="cac:DespatchLine">
              <tr>
                <td class="orta"><xsl:value-of select="position()"/></td>
                <td>
                  <xsl:choose>
                    <xsl:when test="cac:OrderLine/cac:LineItem/cbc:ID">
                      <xsl:value-of select="cac:OrderLine/cac:LineItem/cbc:ID"/>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:value-of select="cac:OrderLine/cac:LineItem/cac:Item/cac:SellersItemIdentification/cbc:ID"/>
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
                <td><xsl:value-of select="cac:OrderLine/cac:LineItem/cac:Item/cbc:Name"/></td>
                <td>
                  <xsl:value-of select="cac:OrderLine/cac:LineItem/cac:Item/cbc:Description"/>
                  <xsl:if test="cbc:Note and not(cac:OrderLine/cac:LineItem/cac:Item/cbc:Description)">
                    <xsl:value-of select="cbc:Note"/>
                  </xsl:if>
                </td>
                <td>
                  <xsl:value-of select="cac:OrderLine/cac:LineItem/cac:Item/cac:AdditionalItemIdentification/cbc:ID"/>
                </td>
                <td class="sag">
                  <xsl:if test="cbc:DeliveredQuantity">
                    <xsl:value-of select="format-number(cbc:DeliveredQuantity, '#.##0,####', 'tr')"/>
                  </xsl:if>
                </td>
                <td class="orta">
                  <xsl:call-template name="BirimAd">
                    <xsl:with-param name="kod" select="cbc:DeliveredQuantity/@unitCode"/>
                  </xsl:call-template>
                </td>
              </tr>
            </xsl:for-each>
            <xsl:if test="count(cac:DespatchLine)=0">
              <tr>
                <td colspan="7" class="orta">Kalem bulunmuyor</td>
              </tr>
            </xsl:if>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="sag">Toplam</td>
              <td colspan="2">
                <xsl:for-each select="cac:DespatchLine[generate-id(.) = generate-id(key('Birim', cbc:DeliveredQuantity/@unitCode)[1])]">
                  <xsl:variable name="birimKod" select="cbc:DeliveredQuantity/@unitCode"/>
                  <div>
                    <xsl:value-of select="format-number(sum(key('Birim', $birimKod)/cbc:DeliveredQuantity), '#.##0,####', 'tr')"/>
                    <xsl:text> </xsl:text>
                    <xsl:call-template name="BirimAd">
                      <xsl:with-param name="kod" select="$birimKod"/>
                    </xsl:call-template>
                  </div>
                </xsl:for-each>
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Taşıyıcı -->
        <xsl:if test="$nakliye or $plaka">
          <div class="blok-baslik">Taşıyıcı Bilgileri</div>
          <table class="nakliye">
            <tr>
              <td class="etiket">Nakliyeci</td>
              <td>
                <xsl:choose>
                  <xsl:when test="$nakliye/cac:PartyName/cbc:Name">
                    <xsl:value-of select="$nakliye/cac:PartyName/cbc:Name"/>
                  </xsl:when>
                  <xsl:otherwise>-</xsl:otherwise>
                </xsl:choose>
              </td>
              <td class="etiket">Plaka</td>
              <td>
                <xsl:choose>
                  <xsl:when test="$plaka"><b><xsl:value-of select="$plaka"/></b></xsl:when>
                  <xsl:otherwise>-</xsl:otherwise>
                </xsl:choose>
              </td>
            </tr>
            <tr>
              <td class="etiket">Sürücü</td>
              <td>
                <xsl:if test="$nakliye/cac:Person/cbc:FirstName">
                  <xsl:value-of select="$nakliye/cac:Person/cbc:FirstName"/>
                  <xsl:text> </xsl:text>
                  <xsl:value-of select="$nakliye/cac:Person/cbc:FamilyName"/>
                </xsl:if>
                <xsl:if test="not($nakliye/cac:Person/cbc:FirstName)">-</xsl:if>
              </td>
              <td class="etiket">Sürücü TCKN</td>
              <td>
                <xsl:choose>
                  <xsl:when test="$nakliye/cac:Person/cbc:NationalID">
                    <xsl:value-of select="$nakliye/cac:Person/cbc:NationalID"/>
                  </xsl:when>
                  <xsl:otherwise>-</xsl:otherwise>
                </xsl:choose>
              </td>
            </tr>
          </table>
        </xsl:if>

        <!-- İmza alanları -->
        <table class="imza">
          <tr>
            <td>Teslim Eden<br/><br/>Ad Soyad / İmza / Kaşe</td>
            <td>Taşıyıcı<br/><br/>Ad Soyad / İmza</td>
            <td>Teslim Alan<br/><br/>Ad Soyad / İmza / Kaşe</td>
          </tr>
        </table>

        <div class="dipnot">
          Bu belge e-İrsaliye olarak düzenlenmiştir. Belgenin doğruluğu ETTN numarası ile
          ebelge.gib.gov.tr üzerinden kontrol edilebilir.
        </div>
      </xsl:for-each>
    </div>
  </xsl:template>
</xsl:stylesheet>

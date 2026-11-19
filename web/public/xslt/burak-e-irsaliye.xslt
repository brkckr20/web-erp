<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  exclude-result-prefixes="n1 cac cbc">

  <xsl:output method="html" encoding="UTF-8" indent="no"/>
  <xsl:decimal-format name="tr" decimal-separator="," grouping-separator="."/>

  <!-- Birim etiketleri -->
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

  <xsl:template name="BirimEtiket">
    <xsl:param name="kod"/>
    <xsl:choose>
      <xsl:when test="$kod='KGM'">Kg</xsl:when>
      <xsl:when test="$kod='MTR'">Mt</xsl:when>
      <xsl:when test="$kod='TNE'">Ton</xsl:when>
      <xsl:when test="$kod='LTR'">Lt</xsl:when>
      <xsl:when test="$kod='C62'">Adet</xsl:when>
      <xsl:when test="$kod='NAR'">Adet</xsl:when>
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
    <div class="burak-irsaliye">
      <style type="text/css">
        @page {
          size: A4;
          margin: 7mm 7mm 14mm 7mm;
          @bottom-left {
            content: "Bu e-İrsaliye simülasyon ortamında oluşturulmuştur.";
            width: 62%;
            font-family: Tahoma, Arial, "Segoe UI", sans-serif;
            font-size: 7px;
            color: #8a6b77;
            border-top: 2px solid #dcc6ce;
            padding-top: 1mm;
          }
          @bottom-right {
            content: "Sayfa " counter(page) " / " counter(pages);
            width: 38%;
            font-family: Tahoma, Arial, "Segoe UI", sans-serif;
            font-size: 7px;
            color: #8a6b77;
            text-align: right;
            border-top: 2px solid #dcc6ce;
            padding-top: 1mm;
          }
        }
        .burak-irsaliye {
          position: relative;
          width: 100%;
          max-width: 196mm;
          margin: 0 auto;
          background: #ffffff;
          color: #2b2024;
          font-family: Tahoma, Arial, "Segoe UI", sans-serif;
          font-size: 9px;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .burak-irsaliye table { border-collapse: collapse; width: 100%; }
        .burak-irsaliye .sag { text-align: right; }
        .burak-irsaliye .orta { text-align: center; }

        /* Üst bant */
        .burak-irsaliye .ust { margin-bottom: 3mm; }
        .burak-irsaliye .ust > tbody > tr > td { vertical-align: top; padding: 0; }
        .burak-irsaliye .bant {
          position: relative;
          height: 25mm;
          background: #5b2c40;
          background-image: linear-gradient(115deg, #6e3a4f 0, #6e3a4f 28%, #5b2c40 28%, #5b2c40 100%);
          border-radius: 1.5mm;
        }
        .burak-irsaliye .logo-alan {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 58mm;
          background: #ffffff;
          border-radius: 0 22mm 22mm 0 / 0 12mm 12mm 0;
          text-align: center;
        }
        .burak-irsaliye .logo-yazi {
          display: block;
          margin-top: 8mm;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #5b2c40;
        }
        .burak-irsaliye .baslik {
          position: absolute;
          right: 7mm;
          top: 5.5mm;
          text-align: right;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 17px;
          font-weight: bold;
          line-height: 1.15;
          letter-spacing: 0.6px;
        }
        .burak-irsaliye .baslik .en {
          font-size: 13px;
          font-weight: normal;
          letter-spacing: 2px;
        }
        .burak-irsaliye .qr-hucre { width: 27mm; padding-left: 3mm; }
        .burak-irsaliye .qr-hucre canvas { width: 26mm; height: 26mm; display: block; }

        /* Taraflar */
        .burak-irsaliye .taraflar { margin-top: 4mm; }
        .burak-irsaliye .taraflar > tbody > tr > td { vertical-align: top; padding: 0; }
        .burak-irsaliye .taraf-sol { width: 68mm; padding-right: 3mm; }
        .burak-irsaliye .taraf-orta { width: 32mm; text-align: center; }
        .burak-irsaliye .unvan { font-size: 9.5px; font-weight: bold; color: #47202f; }
        .burak-irsaliye .kucuk { font-size: 8.2px; color: #4a3b40; }
        .burak-irsaliye .etiket-kalin { font-weight: bold; color: #47202f; }
        .burak-irsaliye .sayin { font-weight: bold; font-size: 8.5px; color: #47202f; margin-bottom: 0.6mm; }
        .burak-irsaliye .musteri { width: 52mm; padding-right: 4mm; }
        .burak-irsaliye .kunya-hucre { width: 44mm; }

        .burak-irsaliye .rozet {
          width: 24mm;
          height: 24mm;
          margin: 1.5mm auto 0;
          border: 1.1mm solid #5b2c40;
          border-radius: 50%;
          background: #ffffff;
          text-align: center;
          display:flex;
          align-items:center;
          justify-content:center
        }
        .burak-irsaliye .rozet .icon{
        border-radius : 50%
        }
        .burak-irsaliye .rozet .e {
          display: block;
          margin-top: 4.2mm;
          font-size: 19px;
          font-weight: bold;
          line-height: 1;
          color: #5b2c40;
        }
        .burak-irsaliye .rozet .ad {
          display: block;
          font-size: 6.5px;
          letter-spacing: 0.3px;
          color: #5b2c40;
        }
        .burak-irsaliye .rozet-alt {
          margin-top: 1mm;
          font-size: 8px;
          font-weight: bold;
          color: #7c4b5e;
        }

        .burak-irsaliye .kunya td { padding: 0 0 0.7mm 0; vertical-align: top; font-size: 8.2px; }
        .burak-irsaliye .kunya .k-etiket { font-weight: bold; white-space: nowrap; padding-right: 2px; color: #47202f; }
        .burak-irsaliye .kunya .k-iki-nokta { padding-right: 2px; }

        /* Belge özeti */
        .burak-irsaliye .ozet {
          width: 100mm;
          margin-top: 2.5mm;
          padding-top: 1.5mm;
          border-top: 1px solid #dcc6ce;
          font-size: 8.2px;
        }
        .burak-irsaliye .ozet .ozet-satir { margin-bottom: 0.4mm; }
        .burak-irsaliye .ozet .ozet-etiket {
          display: inline-block;
          width: 22mm;
          font-weight: bold;
          color: #47202f;
        }

        /* Kalem tablosu */
        .burak-irsaliye .kalemler { margin-top: 2.5mm; border: 1px solid #c9a9b5; }
        .burak-irsaliye .kalemler th {
          background: #5b2c40;
          color: #ffffff;
          font-size: 8.2px;
          font-weight: bold;
          padding: 1.6mm 1.2mm;
          border-right: 1px solid rgba(255, 255, 255, 0.35);
          border-bottom: 1px solid #5b2c40;
          text-align: left;
        }
        .burak-irsaliye .kalemler th:last-child { border-right: 0; }
        .burak-irsaliye .kalemler td {
          padding: 1.5mm 1.2mm;
          font-size: 8.2px;
          vertical-align: top;
          border-right: 1px solid #e8d8de;
          border-bottom: 1px solid #e8d8de;
        }
        .burak-irsaliye .kalemler td:last-child { border-right: 0; }
        .burak-irsaliye .kalemler tbody tr:nth-child(even) td { background: #faf4f6; }

        /* Toplam */
        .burak-irsaliye .toplam { width: 74mm; margin: 1.5mm 0 0 auto; }
        .burak-irsaliye .toplam td {
          border: 1px solid #5b2c40;
          padding: 1.4mm 2mm;
          font-size: 8.5px;
          font-weight: bold;
        }
        .burak-irsaliye .toplam .toplam-etiket { text-align: right; background: #f7eff2; color: #47202f; }
        .burak-irsaliye .toplam .deger { width: 28mm; text-align: right; }

        /* İmzalar */
        .burak-irsaliye .imzalar { margin-top: 14mm; }
        .burak-irsaliye .imzalar td {
          width: 33.33%;
          height: 15mm;
          padding: 1.5mm;
          border: 1px solid #dcc6ce;
          vertical-align: bottom;
          text-align: center;
          font-size: 8px;
          color: #4a3b40;
        }

        /* İlgili dokümanlar */
        .burak-irsaliye .dokumanlar { margin-top: 6mm; width: 130mm; }
        .burak-irsaliye .dokumanlar .baslik2 { font-size: 9px; font-weight: bold; color: #47202f; margin-bottom: 1mm; }
        .burak-irsaliye .dokumanlar td { padding: 0.8mm 1mm; font-size: 8px; }
        .burak-irsaliye .dokumanlar .dh td {
          font-weight: bold;
          border-top: 1px solid #5b2c40;
          border-bottom: 1px solid #dcc6ce;
          color: #47202f;
        }

        /* Alt blok */
        .burak-irsaliye .dip { margin-top: 6mm; border: 1px solid #5b2c40; }
        .burak-irsaliye .dip .dip-bas td {
          background: #5b2c40;
          color: #ffffff;
          text-align: center;
          font-weight: bold;
          font-size: 8.5px;
          padding: 1.5mm 1mm;
          border-right: 1px solid rgba(255, 255, 255, 0.35);
        }
        .burak-irsaliye .dip .dip-bas td:last-child { border-right: 0; }
        .burak-irsaliye .dip .dip-govde td {
          width: 33.33%;
          height: 15mm;
          vertical-align: top;
          padding: 2mm;
          font-size: 8px;
          border-right: 1px solid #dcc6ce;
        }
        .burak-irsaliye .dip .dip-govde td:last-child { border-right: 0; }

        .burak-irsaliye .sayfa-alti { margin-top: 2mm; }
        .burak-irsaliye .sayfa-alti td {
          font-size: 7px;
          color: #8a6b77;
          padding-top: 1mm;
          border-top: 2px solid #dcc6ce;
        }

        @media print {
          .burak-irsaliye { max-width: none; }
          .burak-irsaliye .kalemler tr { page-break-inside: avoid; }
          /* Alt bilgi yazdırmada @page margin kutusundan gelir. */
          .burak-irsaliye .sayfa-alti { display: none; }
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
        <xsl:variable name="ekKimlik" select="cac:DespatchLine/cac:OrderLine/cac:LineItem/cac:Item/cac:AdditionalItemIdentification"/>
        <xsl:variable name="topKg" select="sum($ekKimlik[cbc:ID/@schemeID='KG']/cbc:ID)"/>
        <xsl:variable name="topMt" select="sum($ekKimlik[cbc:ID/@schemeID='MT']/cbc:ID)"/>
        <xsl:variable name="topAdet" select="sum($ekKimlik[cbc:ID/@schemeID='ADET']/cbc:ID)"/>
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

        <!-- Üst bant + karekod -->
        <table class="ust">
          <tr>
            <td>
              <div class="bant" style="margin-right:4px">
                <div class="logo-alan">
                  <div style="display:flex;margin-top:12px; margin-left:8px">
                    <img width="120px" class="logo-img" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAFZCAYAAABE0lHkAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAACHDwAAjA8AAP1SAACBQAAAfXkAAOmLAAA85QAAGcxzPIV3AAAKOWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAEjHnZZ3VFTXFofPvXd6oc0wAlKG3rvAANJ7k15FYZgZYCgDDjM0sSGiAhFFRJoiSFDEgNFQJFZEsRAUVLAHJAgoMRhFVCxvRtaLrqy89/Ly++Osb+2z97n77L3PWhcAkqcvl5cGSwGQyhPwgzyc6RGRUXTsAIABHmCAKQBMVka6X7B7CBDJy82FniFyAl8EAfB6WLwCcNPQM4BOB/+fpFnpfIHomAARm7M5GSwRF4g4JUuQLrbPipgalyxmGCVmvihBEcuJOWGRDT77LLKjmNmpPLaIxTmns1PZYu4V8bZMIUfEiK+ICzO5nCwR3xKxRoowlSviN+LYVA4zAwAUSWwXcFiJIjYRMYkfEuQi4uUA4EgJX3HcVyzgZAvEl3JJS8/hcxMSBXQdli7d1NqaQffkZKVwBALDACYrmcln013SUtOZvBwAFu/8WTLi2tJFRbY0tba0NDQzMv2qUP91829K3NtFehn4uWcQrf+L7a/80hoAYMyJarPziy2uCoDOLQDI3fti0zgAgKSobx3Xv7oPTTwviQJBuo2xcVZWlhGXwzISF/QP/U+Hv6GvvmckPu6P8tBdOfFMYYqALq4bKy0lTcinZ6QzWRy64Z+H+B8H/nUeBkGceA6fwxNFhImmjMtLELWbx+YKuGk8Opf3n5r4D8P+pMW5FonS+BFQY4yA1HUqQH7tBygKESDR+8Vd/6NvvvgwIH554SqTi3P/7zf9Z8Gl4iWDm/A5ziUohM4S8jMX98TPEqABAUgCKpAHykAd6ABDYAasgC1wBG7AG/iDEBAJVgMWSASpgA+yQB7YBApBMdgJ9oBqUAcaQTNoBcdBJzgFzoNL4Bq4AW6D+2AUTIBnYBa8BgsQBGEhMkSB5CEVSBPSh8wgBmQPuUG+UBAUCcVCCRAPEkJ50GaoGCqDqqF6qBn6HjoJnYeuQIPQXWgMmoZ+h97BCEyCqbASrAUbwwzYCfaBQ+BVcAK8Bs6FC+AdcCXcAB+FO+Dz8DX4NjwKP4PnEIAQERqiihgiDMQF8UeikHiEj6xHipAKpAFpRbqRPuQmMorMIG9RGBQFRUcZomxRnqhQFAu1BrUeVYKqRh1GdaB6UTdRY6hZ1Ec0Ga2I1kfboL3QEegEdBa6EF2BbkK3oy+ib6Mn0K8xGAwNo42xwnhiIjFJmLWYEsw+TBvmHGYQM46Zw2Kx8lh9rB3WH8vECrCF2CrsUexZ7BB2AvsGR8Sp4Mxw7rgoHA+Xj6vAHcGdwQ3hJnELeCm8Jt4G749n43PwpfhGfDf+On4Cv0CQJmgT7AghhCTCJkIloZVwkfCA8JJIJKoRrYmBRC5xI7GSeIx4mThGfEuSIemRXEjRJCFpB+kQ6RzpLuklmUzWIjuSo8gC8g5yM/kC+RH5jQRFwkjCS4ItsUGiRqJDYkjiuSReUlPSSXK1ZK5kheQJyeuSM1J4KS0pFymm1HqpGqmTUiNSc9IUaVNpf+lU6RLpI9JXpKdksDJaMm4ybJkCmYMyF2TGKQhFneJCYVE2UxopFykTVAxVm+pFTaIWU7+jDlBnZWVkl8mGyWbL1sielh2lITQtmhcthVZKO04bpr1borTEaQlnyfYlrUuGlszLLZVzlOPIFcm1yd2WeydPl3eTT5bfJd8p/1ABpaCnEKiQpbBf4aLCzFLqUtulrKVFS48vvacIK+opBimuVTyo2K84p6Ss5KGUrlSldEFpRpmm7KicpFyufEZ5WoWiYq/CVSlXOavylC5Ld6Kn0CvpvfRZVUVVT1Whar3qgOqCmrZaqFq+WpvaQ3WCOkM9Xr1cvUd9VkNFw08jT6NF454mXpOhmai5V7NPc15LWytca6tWp9aUtpy2l3audov2Ax2yjoPOGp0GnVu6GF2GbrLuPt0berCehV6iXo3edX1Y31Kfq79Pf9AAbWBtwDNoMBgxJBk6GWYathiOGdGMfI3yjTqNnhtrGEcZ7zLuM/5oYmGSYtJoct9UxtTbNN+02/R3Mz0zllmN2S1zsrm7+QbzLvMXy/SXcZbtX3bHgmLhZ7HVosfig6WVJd+y1XLaSsMq1qrWaoRBZQQwShiXrdHWztYbrE9Zv7WxtBHYHLf5zdbQNtn2iO3Ucu3lnOWNy8ft1OyYdvV2o/Z0+1j7A/ajDqoOTIcGh8eO6o5sxybHSSddpySno07PnU2c+c7tzvMuNi7rXM65Iq4erkWuA24ybqFu1W6P3NXcE9xb3Gc9LDzWepzzRHv6eO7yHPFS8mJ5NXvNelt5r/Pu9SH5BPtU+zz21fPl+3b7wX7efrv9HqzQXMFb0ekP/L38d/s/DNAOWBPwYyAmMCCwJvBJkGlQXlBfMCU4JvhI8OsQ55DSkPuhOqHC0J4wybDosOaw+XDX8LLw0QjjiHUR1yIVIrmRXVHYqLCopqi5lW4r96yciLaILoweXqW9KnvVldUKq1NWn46RjGHGnIhFx4bHHol9z/RnNjDn4rziauNmWS6svaxnbEd2OXuaY8cp40zG28WXxU8l2CXsTphOdEisSJzhunCruS+SPJPqkuaT/ZMPJX9KCU9pS8Wlxqae5Mnwknm9acpp2WmD6frphemja2zW7Fkzy/fhN2VAGasyugRU0c9Uv1BHuEU4lmmfWZP5Jiss60S2dDYvuz9HL2d7zmSue+63a1FrWWt78lTzNuWNrXNaV78eWh+3vmeD+oaCDRMbPTYe3kTYlLzpp3yT/LL8V5vDN3cXKBVsLBjf4rGlpVCikF84stV2a9021DbutoHt5turtn8sYhddLTYprih+X8IqufqN6TeV33zaEb9joNSydP9OzE7ezuFdDrsOl0mX5ZaN7/bb3VFOLy8qf7UnZs+VimUVdXsJe4V7Ryt9K7uqNKp2Vr2vTqy+XeNc01arWLu9dn4fe9/Qfsf9rXVKdcV17w5wD9yp96jvaNBqqDiIOZh58EljWGPft4xvm5sUmoqbPhziHRo9HHS4t9mqufmI4pHSFrhF2DJ9NProje9cv+tqNWytb6O1FR8Dx4THnn4f+/3wcZ/jPScYJ1p/0Pyhtp3SXtQBdeR0zHYmdo52RXYNnvQ+2dNt293+o9GPh06pnqo5LXu69AzhTMGZT2dzz86dSz83cz7h/HhPTM/9CxEXbvUG9g5c9Ll4+ZL7pQt9Tn1nL9tdPnXF5srJq4yrndcsr3X0W/S3/2TxU/uA5UDHdavrXTesb3QPLh88M+QwdP6m681Lt7xuXbu94vbgcOjwnZHokdE77DtTd1PuvriXeW/h/sYH6AdFD6UeVjxSfNTws+7PbaOWo6fHXMf6Hwc/vj/OGn/2S8Yv7ycKnpCfVEyqTDZPmU2dmnafvvF05dOJZ+nPFmYKf5X+tfa5zvMffnP8rX82YnbiBf/Fp99LXsq/PPRq2aueuYC5R69TXy/MF72Rf3P4LeNt37vwd5MLWe+x7ys/6H7o/ujz8cGn1E+f/gUDmPP8usTo0wAAAAlwSFlzAAAOxAAADsQBlSsOGwAAfRFJREFUeF7tvQeAXFd5/v1Mn23aqt67ZEmWZFvFcsUFG2NMsammEzohQPKHkITeQvlCSHBI6MUYgwEDtgFj415lq/fe60raXqZ/53nvzGq2GcvWSnel57e6mpl7p9x77inPec973hPIOXCayWazSHYm0Nbcgs62diQTCSQ6OtHe0or6fYdweO9+NBw6gpaGJiTa25FOp5HJZJFNZ9ynT/vpCyGEEOKkE0AoEkYoFEQ4EkG8rAwVNZWoGzEUw8aOxrAxIxEvL3PHwohGYyhxz8uHlCMciyIQCOS/4/RxWgRWLptDZ3sHWhob0dnR7oRUGw7s2IO1TzyLLavWouHYUSegnHjKuhPMBkxCBd3/OZfY3eFrCSwhhBDizCPg/tj298TtcQIqF3SqwMmAcDjiRNdIzDj/XMxZcgFqRw1HvKQEJU6QDampQuQ0Ca7TIrBoodqych0e/N3d2LR2FVqbWoCOHBLtSaQ6E8jmMpYY9hcIIhAMIBgMWoLyj3hpJYElhBBCnJl4bXxBpVCu2JbNOp2QM63A13xXKBRGNB5DtCyGUCyEyppqzFm4AFfcdANGTRyHUDjsfckp5JQKLA4DHjlwCHt37MTmZWvw+N1/weaNa82aVRIqRVl5BeJlpYhEIp6gcph27ZG4hedCCCGEOHPxbCn2v2d4yT/nvi494ARXKplER1s72lpbkMomUV45BLPOOw+XvPJajJ82BaMnj0fV0FpEolH7zKlgwAVWJp1G45FjdtFH9h/CsgcexxP33Y/2oy02BJgLeD8fRAjBkGelcqmWF1NOpWbzp8cHd8iTXXyLe5H/rBBCCCHObEyuFMSW27pGtriPGy1bZt2iuOAudywcQHVdHS579cswa/H5qB5Wh4rKSlRUVzrNEbLvGigGTGBlMxk0NzRiz/Yd+Ovtv8fqZUvRcqwRgaRLEPpWBQNm0vPUaM4SJZPNWKIEOSzoNqYgEyfnnoaCIZSXDUFp3qGN5j4TZEIIIYQ4I8mkMzaxLZ1Moa21Fe0drebHjbQTEtRR7mlBVFFPhJ1WCJjw8gQZP8v3B0JuRzSHmhHDsPCyy3DRy6/C6MkTnKYo7xoxO9mcdIHlObC3Y++2nXj0D3/Gg3++Bx317aY2KarCASeq3MXQpEdBZRfOPyekAvEg6mqHY+q5szB26iRTmrUjh6GsaogJrJBTmxRVpkopzEycCSGEEOJMhBKlsDFyAHUDDTgcGTuy9yCOHTqC3Zu3Yfv6DWhubkA24cRW2r3f/QWdRqAxhnohm8k6TZb2FJnTIpUjq3Ddm96A8y+9CCPGj0GsJJ7/xZPHSRNYVJkN9UdwrL4eW1avwx9/+isc3rnPRFA4GDaBxAs2S1Um7Ymt0giqqmoxfNRozF5yAc65cD4qhgwxPyxeLKdlRqKR0+KcJoQQQgj/QdmSSaXN7yqdSllYp472drQ2NmP5g09g9ePP4OihQ2hvb0GmM2PaIxwKI0gdQqHmRFra6RBaribMnIaXvf11mDJnJoZUV5vv1smyaJ00gdV8rBF/uvVXeOyBv6B+3wEkG5IIBUKIxeKmHvkzTIjmpiYkg5246KqX4sqbXoGaYUMRLy01a1VVXa0TUwM7JiqEEEKIMw/6fB89eNisWh1tbajffwD3/vw3WP7ME6iIDEF5RaUZbKhHOIqW7Ow0F6RIXQxjp03Gda+5CYuueglKykrz3/jiCH3WkX/+guEswLVPLsMjf/gTVj+zFI31x1BRWmniilBYdSY7bYy0vKoCo6ePx5Krr8RF173UhgJrhg8136qBGgcVQgghxJkNNUTZkArUjRqO4WNHo7K2Gk3HGtDW2YpcMotEMoF0OoUg/9x7OUqWTCVxYN8eC2ReWlKO6travLHnxY+cvWgLFmNarXtmOX76xf/Cni3bbWyTvlI0x/GL0+mkqUXEgNoRw7Do8sux+GVXYMTYMRhSU23vFUIIIYQ4mdAxvvHoURzYvRcP3PF7rHpmqY22BRIBm0zHAKUcPsxkuTpMxmYVzrpgPm760Dsxbf6cFx3S4QUJLH6EJ0MT3PqVK/GDL38DR7ceQiQctRl+hMdTmSRiVTEsuOhSLHn51Rg1cSwqqqrcNvDTI4UQQgghLFzU0WNoa2kxh/j7f/F7bHTaJZPMmG7xfLMYSytlvl2jp47H2z/9Ucw8bx5KSl/4cOEJCyzO+mtpasLurduwbsUK/PFXv0Hr3mOIhWLma0UHdjq8832jJo/DzR//ACbPmonK2ppTGuBLCCGEEKIYBjynb9aqJ5/Gb3/wYzTuPopQgGGfGKUgZA7wyWQnaqYMx03vfRfmXHA+ho4Y8YL0ywkJLL61paERj/zpXtx12y+wf/tuxHIxE1ckmUkilUmYhWr+hUtw3Vtfh0lzZiIak7ASQgghxOmHWoYjcIx4cMc3v48tq9aZ8IrEo7ZoNB3gOzOdSEWyTsPMwJs/+D7MXbjwhEXWCTm508y2Ze16/OyWW3B42z5EshHEw94sQQ4HtmZasfiqK3D5K67DxS+/GpNmzZC4EkIIIYRvoGahWGKE96GjRngaJp3AwUN7EY3EzDecf+lECo31R7B3707MW7zIIsCfCCc0ba+9tRVrly83y1UoG0ZZvMxOjLGt0u5v0uzpOO+SCzFvySKMmz7FVrAWQgghhPAbjLc5Zd4szL1kkS2jM2LCGFvHkBYuBjUvi5cDKWDb6g1Y++wyi7V1IjxvCxZnC656eilu/+4PkGtOIxZmCAbGt8oimelEzcQReMc/fRTzL1yM6mFDzXJF8SWEEEII4UcYqqF25HCMnTLJwjNs2bwBnS0dFhydGiYcCiGXzmLHts2YOG0q6kYMf97RD56XDxbjXK1fvgL/84Uvo2FXPeLm0B40Z7BEJoHaicPwnn/7Z8xdsACRmOePJYQQQggxGOBIXGtTE55+6BHc+q1b0HawGdFwzMI55DIZdCY6MHryeLz3C5/E1LmzEY3/ba3znBYs+lw1H23A6ieW4tavfhuHtu9DPFJiaweaQ3su6cTVCLyP4ooOYBJXQgghhBhk0FoVjccxfNQo1Ayrw/o1K9DR0oZALuDNMAyGLIg6I8UPHzcKFdVVtvLMc43U9SuwaNiq33cQd//oNjz023uwd/MOc/7iuCStVm3ZdoybPRXv+n8fw9xFixSCQQghhBCDFool+o4zLENZaRl2bN6Eo/UHEQ5EEM5Hdj988ABSFo4qZcOFz7VIdL9O7rReHdyzB08/+hBWr3gGgbC3KjXjXNFydcX1L8Nrbr4Z0+e8+GinQgghhBCnG4qs8spKzFtyIRZeejkmTT8HqUQK2UwW4WjEaaAs7rvrd/jjb+9AY0ND/lN906/Aot/VpjVrcfRQvUU2DYXyEdrTGVTW1GD2+RfgnHkvLsqpEEIIIYSf4Ehd9dA6zF5wHmbMPRfRWMwJrIy5R9Hpvan+GPZs2o7tazcg0dGZ/1Rv+hRYFFF7tm7H/Xf8Dpm2FIbWjkAoGDarFrLAwksuwYx5c1A3eoQpOiGEEEKIM4XSIeWYd9mFuOj6qzFl7kxkchlzhKcWGlY1AqmjCfzpR3fg4K69Fpi0L/oUWE1Hj+K+2+/Esd31NvYYjcTNJyuVSWHs9Ml46RtvxNipk82p/bkcvIQQQgghBhsMxcBVaWYtOg+v++i7UTm2xgKq04pVyhigTlNt37AJyx95HG2trflPdaeXwEqn0tizbQeeevQhBIJBRCJRE1dpJ67iQ8tw8yc+gImzpstyJYQQQogzGjqxTz13Fl7zrrcjGA0hnU7RUctmHNJydc9tv8S+7TttCLEnvQTWscP1uOuHv0CyIYFIKGIWqlQy6b4IuPTqazDpnBmISFwJIYQQ4iygpKwM8y5chJlz55qoytAfKxhEOBhG8/4GPHH3/WhpaMq/+zi9BFZHexu2rF/jxX5wX8AvS6dSCMVCWHDFpaioGpJ/pxBCCCHEmQ0NTUNHj8RVb3wVcrEckumE7QuGQzbCt/ThR9DS9DcEVmdbuzlstbe0O3XGZXDcFyWSCISCGDF+NIaNG2Vh5YUQQgghzhYYuX3c9MmoqKmy15z0R38sCi0GH22oP4pUMmXHCnQTWIf27sPjd92LgHsPTV8cU2xuaEBJWQkuvu4aVFZX598phBBCCHH2UFZegTkXcEnAKFpbmm25QFuzMAmsf2o5Gp3IKsYEFqcetre2Ye+OHVj21BPI5TyTGIOKhkoiGDphNOZestimLQohhBBCnG1U1dXgqte/EhWjKtGSakLaaSQuo8MgpA/d+Udzdqdli6N/xARWW1MLnrn/ESy77wmkG1MIO0VmQbWCQVx50yvx8re8AcPHjjKfLCGEEEKIsw2uZjNy7FhceOkVmHf+YiDnuVIxMGnDkSPYvXkbDuzYg1Qiae83xdTS2IiHfncPHrvnLzZbkKtHZ7IZRCvjWHTt5bjw2itQXinndiGEEEKcvVTW1eL6t70R17zpRoTjIbNYcaWbXDqDR3//Zzzwm7vQ3NBo7zWBlUwmsX//bhw8tAe5oFNYAbpuAWMnTETd8OEoLS+T9UoIIYQQZzWRSAR1o0Zg2OjRKCkpNwsWXapy2RzWLVuO1U8vRUdbm703SPXVfKwRyY5OewOllRf2PYAxEyegrEJ+V0IIIYQQtD5xSLC0vBS1w4aZMSrvuG6hGpqOHbP1CW3osKO1HZuXr0W2NYOK2BCEAiETWAzNcM7C+aiqq7XvHKzwIrkxMFhfkVbF84Ppx62QnkKcStj54xqpdCYVLwBXZln/cfM60OKEyadhoR4UJ0ahHT5T0q96WB1mX7QAcFop666HVqxIKIpMIoNjBw4jnUwhcGDXntwt/+/z2LJinY0lRuJxpNNJxCtL8Jkf3YJJ50w3Z3e/YzfPnX97S5vbWpHsTNjsyMINTSeTlgAMe881hgKBoKlQrpJdWlFuMyTP9mFQm03a3OqlX8Kln2vMcjkvDTvzipxR/Jl+3ILBkMUGYdrR0kkHQCFeDGzAWptaXD5ssRh8WZf/KK4Y7JiOo8x3UVeGWVZZnjmDp8T1JMuGVFjZ5r6zmUIZ7mxvt5g8rOQ5lZzLeyQ7knDdI0uzaCzqlWG3xUtLES8rtX2cfn6214MU8h1t7VYPJto7LP0K4sBrV3Ku3otaTEj6KzO9mG5sR8orKyxNz2ZYhttc+WX6scwyT1KAcBk+ph+LqOU/115YGXbtCMtuaUWZK8tlg6Yd4fVsXrUGX/i7DyPbwUWgg2hpbLKZhpffeD1u/OA7ENi1cWvuM29+P5qPNLqLLHEfcwnhhMrMC+biA//+bxg+brT3bT6EPbF2VxCajhxFZ2eHxaBYv3Ql1j+5HAf37EMySVFAkeDUckEwBwNmpQsHIyhxlcqoSeNwzuLz3TYf1XV1qKytNtFwVlQyLl2Y+Znpm441oMGlI9Nu3VPLsH/HHhtHTmfTrnBkXKnJJ6ArHCwUFKhcBHzkhLGYfaFLv0XzzNrJ9Zmqh9ZaXhqsjR2FZWtTs5l6OenDuw7v+q2BCgfNN5EN00DCe8OKvuFwvVXqxanJswmEAhg6YvigTmuWzc62Dptok+jsREtDI5Y/8ITlwUN79lvEZKY504KLq7oL9cowgk4ghG3yzdR5szFnyQUYP3MKhtRUuftS4irrChMQZwsUUscOH0FDfT3WPrEM21ZvsOCHxw4dRkdne74M59/MrOLSkfF7SkvLMWHmNEw5dyaGubp+1KSxrvwOtTJ8NnWYKAQa6o+gwwnTpmON2LZqA9a7PLhr01Zb3cSEPksd60EWPtc8sI0IBsKIuTqPPjmzF5+H+S9ZYu0IFwmmaOCavYO1bD5fWIaZ/zgsRoHReOQIVj78NNY/vRyH9x5wnfMOZHKFdiT/IZd+XpDOIEripRgzZaJrRy7A1PNmYUhtjdtXgiqXB9kW+zn99mzZji++/R/Q6MpeKBK1jiAzyLjpU/Cx//4SAptXrsl95q0fQKKl09bbyThVxje88r1vwcvf/npUVHtRS/0GRcH+Hbuw1t3EB399F/Yf2GM3OZQKuAbSawwLYsB76j2yoBh8i9vsuGuoQuVBTJ81Fxdf/1KMnjIBVTXVVmjO1Mj1zAhH9h1Ew9Gj2LdtJx67+z5sXr8amVaXPq4SMVFK8nmbPTVilQwf86KV6ceGPhPJWK9k3LjJuPoNr8a0eXMwYvyYQbkoOHtfD/32Hvz+x7ci05lBJOwteE68Rc9L8L5PfRJzFi6wfQNFW3MrVj/5NH7yjW8h3ZZ22TTf4Ll7ks6mEKmK4O+/8DnMmDtnUDaGtLAc3LkbG5atwlN/fAB7d+5Ec2sTch0Z5FwZZooX6lbLZ0VlOODdDndfvIYu57JnSU0Zps2ebVb3OZcsxNiJE5wAqzRL9ZkIe9Bc/4wC4NCevbjnR7dj/eqVrgy7OpzVnEsby7f5yy+UYWL1YP44Ryh4LBfMITIkivMWL8HVb3o1xkyaYELhTF69w+rBA4ewe8s23Pvz32DThjW2okko5coT86DXw7L3Wg7MP7eOO/Njvl4gQVcPBkpCGDtuIhZd8xKMmzYZI5xoHTFh3Bm7fi/L8IEdu3Fw917s2bQNT9//EHbv2oFcp0uftGUwq6/yRfd4O+L2F9oSe3DpyvTLRNLWYZw0ZQZe6tqRSbNmYNhY/64gU+/a0B989htY8ciT1qFj/qBIr6ipxOdv+1+E3nDDjZ9deu/DrkLLukzgFFg6Zf5XvDiGhfdjxU3L1aHd+/DDz/1/eOyue3Fk/yGkO51ydDfUVRUIu3PmDWEPl8/5yIs/vnmvuY4QbyxNmsnOJI66grZm2TNY/ujjOLL7EKbOnW1myzORhsNH8ctv/R/+8PNfYOmDD+PQ9r1IticRzDmxyfTjxrQqpJ89FtIu/9ztY7kxv4RkBqmOFBrrG7BhxUqLBUIrKIduBhvJjgQ2PrMKT9/7ENoam03Mt7e2oqO1DW1N7nUigUVXvQSjXMU5kHB4Yse6zXj4t3905+ENV/Ac2AC0uvOi1faKV70cQ0eOGBTD+D05euAwfvqVb+GBO+/CgW270d7UavmIlTDzH2frFPKbV44L5TefL93mDcfkXMcwY5awI67HvHntOqxe+SwqyofYPeLwzZlI09FjeNB1BO7/9e9w3513Yvf67a4MJ1wZpvsD0yjkpZulXeGxRxq6RzYKrP9puWXeP7B7D9a49Au57xk+evQZHWCay5vc8d/fx92uHty7cQcSrZ3IpVw7kq8HI2GXBwvpV5RmfaUhrcwp1440HW3AplVrsfLxp7Fvy07MXDBvUNaDzwe2vT/+4jdx36/uxNqnluHY/sPWFnvtsMt/kXzaFdIwn16WPy1NvdfWDqddO+LKcao9hYaDR2xG3qFd+zDjvHNt+NWP0C3pkBOXW1astde8rlTKtaNRxhB9BYIcXuPCzjTVERPk7umQ2ipLDD/B3gbN3js2bsHKJ5/C+mdW4MDOPexXoLSkzMzd9KkqHgM3pVy0deFuKAsFKyEb/42XIZ1IYe/WHdi8Yg3WPPUsVi9dajMs6QNypkBxyqEvXtuaJ5dh8/I12Ld1p10708B81FyaWE+NW57+0pFpHY259CutsCmrrKT3btmBdU8vx6qnluLQ3v1OFLTbEM+gwV22+VW4ws9Gnr1Pdj5si0QRDlBYHk+bgcLS2vWiw4Gi389v7EBwOSuej92rQQQrpWOH67Hq6aVYt3Q59m3bhZTLf5FIzOWhsl5lmPSV9wivnWlBH6KYy4ccpqBFYvPKtVj1yFPYtHy17TvToI/V2meWYdVjT2GtK8fb1mx0jXuiqwyzYTM3h37KcAGvDgybXxuHvEvc5zta2rBl1XqsenSp9cy3rFrnfq8j/4nBD6+fQ4JHDx3GmqXPuHrwGexYv9k62SWxUpS5uqxQDxanH+lKw/xrw73Hqwdd/nVtEK2H9U7o71i3Cetd/l799NOW38+kCRosw4dd3b7yqaddGV6Bneu3oH7fAZc2sDToKsNMv6Ik7Jn/DOZB914OtTLtmQfTybQNz1K0ee3IPlttxm/tCOuemuHDrBwVrsvaBvecZSZ0zcLLPrt19XoTEbxIWiOovl76phvdB4faB/0AzeEUAk/d+xAevfvPeOAPdzmlm0RZebk1gnaePW4cbwYFBa+t8Nx7jyeuush/LOQqpZL8DW5rbcWmTWtRNbQOtXVDvQwzCK0ExbBQNLpe79KHHsHPb/lfNO4/ahm6vLzSrs9Lw/yb8xTSrSv98sOHlord0tDzEfIEawkSiQQ2bVxjv8necQkdaUsHh68QLVTb17rK8ekVVjmEnaDhWfPcmQ7haBhLrr0SIwfYgkX/q90bt2L140v541Y+eQ7MhxziCbr8evXrXoXqYUPzn/A3bGDo11e//wCefuBB/Oq7P0Db0RZb38urkOm4nn9znkKFzM96ZZll2B3Iv68rP7n3BN1z1gUlLv/FwjHs37LLOkwjJ49FZV2NHRvsMC0oGNe63v1Pvv4t7Fy7GdlExjo4FJiWHj3KMOu/4jLspaGXiMXpx42vmE5Mv/rdB028MQ3rxgxH3YjhnrVhEMM0YKd5++bNWPrwI/jtD3+Chr2HPVHlGngbwrK0yH/AUUgzy4eF9GOaumNd6VcEy2fc5cHS0jIkU0ls2rAWpWVlLv2G2f7B3o6kkkkc3LUXf/3tXfjdT36CzqZ214ZUuGssaot7UEi3rvRzaclkJt3ezzzoXoYiIcTjJTa5aqNrR2yyRjpj6VfCdsQvaehOln5nT/75r3Zt4XDEtXkZ6/zSchlaMn3uZw/u3OPe6Y3Fs0GMlcZx5Wtf6ZsQDfQL2+l6GL/4j//Fg7+5C9tdz4Bm3Kjr8dIEXnyDWAh4gRzq9AoJ/3ObvcdtPM4hrWzabd6NZsXM4/weOn6GabZ0jxyyWLNimZk7a+rq3M11BTDfyA0meOMTHR1WKB747R/w6+/9EO2HW6wSNRO4u9bCNVn6ufThRAdufG3pxvSxN3gbZ9ZwrUoe5mcLn7c0dGnEraO5DaueXYp1K1cgl85i9ITxNrHA7+lnAmvNRrPC8QKZxwjPmyscUIhfeAoEFmeDbV+7wRy++duFvMeNHaFAJICrfFROnwvmwfr9B/GUq4ge/N3d+Mtvf4vOI+2IsQy78la4LnI8D6a6KmM7ZIfZU+Rwljc7mN/LnBkIHs9/bMBMCOQCOHLoENauWYayqiHWyLGCHswigeLq6Qcfxve++g007DqMSDBvVS2uB618Zi2vsgzzORMwn0K2UR4U0pDvL05/jmawgSAcHj+4fy/Wr11hjshDR4wYtOnHvERH9vt/+zvcesv/4PF7/4p0U9LqQTaMXennKK4HPcsT852XTt4bXBq7/awDmc6FY4XN6kB3T6webG3H+lUrkE1lUeM67PEyJ7Lc/uLfGwxQG9Dnj9bSu35wGx74zR+Qaknm2+FIt2sqpF/GlWG2xxT5XcfseNF7XPpxR6EdJl4a5tOvqQ1rli11nYplSLR1YtT48TZkWCjzpxPWNWxbH7jzbru/dKsxI5V7HDt1EkIXjJn2WY7lFy4s5y52+NgxuOQVL/WFgzsrBzqz//Jb38OKBx93J59zPY0S74bmhzWJVSj5AsGLLhlSislzzsGcJQswe8kFOPeiRZhxwbnmMOeqFiQyCdcJ8ZxpKbbc3fJucB67wa6SSbobunXTenS4REy7768dPtR6OoMJBj979uHH8cg9f3YZ4fdINiVcpZLvrRXhpV/Krj0YDaG0sgzjp07GvMsuxPkvWYJZi8/DpFnTbeYg/Vra2lusZ8GZhkw5fq5QiArpx+Gt9qYW7Ni8CeVVVRg7ZbJZK/xMscBiJVA8VM40OlUCi2uEbl29ARueWeXS0yvMBWyR0Qhw1U2vGhQCi728++64E7//yc+w7pnlCGXCTly5hiafXww2WiYKXOfI7S8dUoaxkydi0uwZmHvpYsy/bInNGKRlnWkRCAfhugHWAWNDxw5iV/5zf7SIhdzWcqwJSx9+GJvWrDafosFqiaFFc82zz+J7X/v/0LLnGOKuDPM6CtdMaNlMufQzUeWyS6w8ZmX4/JdchPOvuBizF5+PafNn2wQUiqyOzjYbHfBmCzux6r7Lvo/5jenn8jrLccuxZnOgHz9l6qBNP4YNeOiue/Cb7/8ILYeaUBKIIxqKdqsHzcrCepD5yaUD02/ctClW93GW4LkXL8SsRefbRChasjuTHV774QSE1464fFf0ffwOph+Hb3du2YyOdvd+10bVDh82qNoR5qdDe/bhz7f9Gn+94/dY/fgzrjIEolG2I0Vl2ME6MpVy7YgTQBwNK6uqwMSZ06z8nufyIS07E2ZOwYhxoxBy7Ux7R6vlQUs/R1cezD8vtCMdze3YuXmL+0wYE9w94YgI0/t0wvPjDPz7ndjMUWC5toK+eKyfho4eicAHL3917tjho9ZAMnMxcZiB3vflT5oYOd1wTZ8//Og2/OEHPwfcBUSihaEs6mDWyV6MnGzaVQ7uhtaMHobr3vw6C5LKGTAMG8BhK14wG0veePovMC4WHb1XPPokHrjnLrQfanW9QSfaCv5HefgriUwHmlOtJi7e9dGPYN6FiweN4yzFwvLHn8SPvvlf2LF+E4ZEKkxcdV2hJWU+Dd39rxpZg2tefyNmXuDSr9qlXzSKmMvINt3Yvd16ba5Hwin19OVa8fATuPe3v0HzgSYEs67nywqZlW8hDd0jLQ6JVCfKRlbiw5//DM5dvMD8iPwKQzTcd9vv8Csn6lnZcqow04gkkwlES2P42H9+CeddfpHtGyhYof3ltjtxzw9vtzxpPiF5uLxVpDSCL93+fUyYMTW/158U8uAtn/ki2g43uUYtZpVmIQ8WerIWb8jlwcpRNbj2DTdhrusUcRYg857FzXE9WuYlxseiMzY7U01Hj+Kvv74LSx99CIljnYiEuvekCfM1JwSwrqAV5oNf+RSmzj2nm3D2MyybdJxe+8yzuO3b38GRnYfN6tJXBynFGIZDy3DueRdgyjnnuMZsrrk50EeNZZPpYuXddYxYDzYeOYYn/vxXPPHwX3Hk4GGEO0OIhr0YWcXw3nQmO13DNhUf+Mq/YsI508z/ZLDAYS368vz3Zz6PtoPNiLk8yPQrlGvmjYxL54xrR3KhHCpHVOOlN70G8y+50AwNFEPWjlje8lxWaE1MJDptyJH+wPfe8Ws07290eduzXvVqR9LuvakW6zC8+x8/5vt6sBjWiffe8Vv8/oc/w+Fd+1FRVoVosf+ne+jejtS5MnwjZlww12tHXKea1mPmQaaFWU9TXjvS7NqRZx54FPf//ndO+DYjkPEmuTC9j3+/144kUwnE6uJ49798HIuueIl95+mGCzx/9s0fRGtDs9VTbB/ZsaNhInRu3fjPcgcvhMqLZvXxM6di/uVLfOG5f+jAfvzov/4b7UdbbDihONMS9lxb2hutl8bCcN1bX2cqeeT4sXZjOSRFh0U2knzkawqvytoa6wmPnjjevXcctq/cgGOHjlilwV6bu5v2/fy1YMBVNk5ctze04PC+/Tj3wgWocBX/YODw/gP48b9/E7vXb0MkG0a8R4+DwjPpKonWtmbMmD8Xr/37v8OCKy/FmMkTLFJtuUsrS0NXwVCsUmwxsGN51RBUu4qb6Txy3Dg0HjqGpiMNFuKgZ7BCsya4SqejqRXH9tdjzuILfL14uF8sWDTHb16xFttXb7B8X+x3kHXigpXzFTfdAAa28zOFPHho217XsMVNBBVD0U4rOidajJ8+FW/4yHux8OrLMcqVTca1YhBb9lYLZZhro7JsM2Yd8yhF06hxY7HmsWfQ2tjivjFgFbQVXr5yaUeLN30BmaYl5eWYPHum1wMeBDC+330/vxOP/eE+7Nm03aWhE0CuPBWwOtHlUzqnM23e8vEP4bJXvAzT5s/BqEnjLZ2Ol2GXhu6xUA+yDI9275m94HyMHD0GO1ZvMsspy3BxXcthQ1r7m442WvgaWrEH0wxr1ts/+vf/wIHNuy0P9hSnbPCbm5usTZi1YD5ueNfNWHjVZS5tJlgeZABM5hevLYmbYGUdVmhHGIphpMuDezbuQL3rGFFIsC0pCDivHXFpmHL3qaEVR/cdsnbEz/VgMYddO/zj//wvHNtzGKXRsu7iytG7HXmXa0cusfRjHuN1WjBbtiFMP2tHXDnO50G2wRz6a65vsHaEgo55tWc7wmCenEnNsEznXbQEQ6pO/ygbhdXTf34QbS2t+fN19zwYsHo5SMVpOwzP14GzpooT73RBk643O+GgjW32PCdTzNmUBUOduXA+5l2yGLNd413jKt3nE/uGqnqEEwi0SE0//1yUVVaYAqffQaFgEBaM8rirTBJZ7HANL0NEsAfjd3gt9LvibJaAO/fyeHm3ioXXyCCE6VzGKk1aLtmrqhs5/Hn1TtnDoBl07oWLMPfihRassHxIhQ3ZFKcf4e8GXc+EwqXhUL29Rzw3TEMKKSuffRTHno2EH2E5oSVux9pNCGWDJgyK8wafc0iQPdG60SMwY8E8lwcXPu9hKIrMcexcucp26txZ5t9Cvw8bZiyC1m0KY/aut65fb7FqBgNMn1bXaWHok21r1rsyRGt8Ubq4fMGePa15HLJiGsxfcqEFD60dOexvlmMKAXaS5i5ehAsuvcSGYPkZDmP1hBZEdjC2bliH5sbG/F7/wxmD9Xv2u47KRrOy9yw3TGMOq9aMqHPtwBzMde3Iua5OGzpqpNVxfwum11BXZzLfMjRNhRO0vB+0zhTndWtHSso5JOLKwwab7cr09DtsD3dt3Ar6ajMECJ3Pi9tiXqMNNefSrj043o7UujL8/NqRMIaPHYV5S1w7ctEisy5XOFHL9qs4/QiFfghhO58D23ebFfF0w7qF9RAFYH6PSxSX71zdF+QN7roG90hTaTfT3GmCTnGc7n//bXcilmTk9e7mfCZ8MpNEvKoUr3jbzbjura/HvJcseUExW6qG1uCV734zFlx9maukouZc3LOCofWAASezTqhwWKytuTl/xL9wyZHlDz+OXCJnjrDdnALdvWYj1J5oQ8XQKlzzpptw5WtfYZapE4UhPV76xlfjJvZarr7U9vVZQbt8ResQp9DTrC6eG1p2OBzWo44xuIsNrR86Qs8FLZorH3nK8iAb6J4wn7DXN/eSRa4MvxbXvvlGq1xPlJoRQ12v+d244CUXoXZ4nbkA0CrRhUswWrHov7Fz60Yc2L3bKnC/Q3GwZ+t27N29Aw2NRxCMHPczK8DGnK4PU5w4uvFD70T18Bc2q3TMlAl4zfvfbj5aFMbd0s9BwRtyv79uxXLs3rbNyjBHP/yOhQR5bKnlwXAP6ylhPRiOh3HVa1+FV7/nrbj4FVej4oXUgzXVeJnLwxddd5VZahgomPemGOZ1WlcZL2v90hXoaGnNH/EvHEZ+8I67EU6Ebfi4WPTwOYel25NtqBzurv9Nr8WVr7vhhbUjLv2ufuOr8Lp/+DtcfP1VFo+zrzJKLRBOhLD0vodtRvJpx5VHdlS8Wvk4NlQ4u278Z1lguZmadu+ZOGu6LT1BM/LpgOPlDPq5fvkKPPC7u10JcInao3Lm0KDrEuAVb78ZV77mFU4BjzazY7FJ8fnCcXVO46bjZ9oJABY4Vh4UVcXfR6sY02jfgd0479KLzbTp1waOPfU927bj1v/8toWzoMAqhgWf/i7nX34xLn3Ftbj0+mvMmvdCnFeZfjT3ssc80qXhwZ17bakipl1x+jA9s+6+sVBMcT3toaNGeMd9loZ+GSLk0NDap57FHtfRsLTMC2SeExu/kooyXP7q62wIyI/wHPdt34lbv3mLTRZhb7Y4P7ACorXpvCsuxg2ug7PQifO6USPzldWJwXzLCSj0vRw9ZZL73V22SkFPEUorQqojicbDR62n7fcAkLTe3/r1b+PA1j22NBV9IgvXwzKeSHaYczqH9N/+rx8xn5cXGjWc98cb7hqLLWvWmt9X0OW5QoxEdszZS2dAYuZNTlzg8CLLvh9h/Ubry+aVa/Cb7/7Igoj2DCNAgc+OzKU3XIuXv+0NFly7tPyFrUvL9oEigb7LbMP43c0NLg1d+hUP7/O7WY8c3LvP/DjZ9hSfk59gGd21ebOFs8glsr3aEV4jjSGLr74CL3nly524fKmNKL2wdiTotSPDh1lbxDy2d8tOq/e6tcPuNeuWg4f2Yuqc2e79w62O7mZAOIVwOPOpvzyIpvpjdp52K91/FVVV7t53u7HuOf+deN46qTQ5xfzHn/4K9912J7IdmW7iiudbmBo7Z+H5uPi6q63Hxkb+xcAbNH7GVLzhH9+H1zoFXTduhAmtYrXO32aF3Vnfhg1Pu95Ha1v+iP/gotfrnliOjqPttsRKVyXpYMXM9OMwwnVvfq3FUho2ZlS3TPxCoJmU/nuv/tDbUDmyyvVsug8VWl5zG/3q9m7fYYHp2PMWfcNKhLOPjOJiSlw69pxa7je4ptvGZ1ejrb7ZhgaLz5X5gssODXXl7Ia/e5M3tFLN4MYvvBzTGZ7DjLSivvlfPoT40FJzISjGKkAEsWndGgs02Zel1S/w/nNtwe1bN1mDXFpa2q2MMv1aOppQN2kE3vovHzY3h+czJPNc8PMz3Pe89Z8/jHh13OI4FZdhNpwB9/rpBx/Eo3/+s4U9KD7uJzjrcsMzK7H2yeVoPtzUKw8yfdmWjJk2EVe/6TXWwS7uTL0QmH/HTpuMN3z0vbjx79+J6tG1dp+61YPuHvI+cv26fdt2IOU6dH6FvpEP//pPyLSkexk5KOwzbqPF89qbb8Llr7nehghfbDvCcjx26kRc/843YtTEcZ4Idm3WcVwJdufSeawDz/zlEbNk0VJ+eum7Hu6dEswHp7G8MCMyrMDyxx7H6qeecTfRm/JYgAmdTCcRrY7hhvfcbI6wL/aGFmDPmT24uUsW4pXvfLMVlp4mXlPm7l4ve+BRW67Er7QyNMODj7kuhku/MNPn+E2l1SBSGsaNH3o7zll0njkgvliBWoAV9IQZ03DVa15NA6P15IrhMFHW7Vr6l0fxxJ8e8HUanm7YqCacwOpVdF2ZYCMXjrgG4zT12p4PR/YfxDP3P+R6uOydds9fLFcsXze8682YcM70kzorl5bsyefMwCVXXeNe5S3zRYRcZyPdmrZFpblcj1+xIf4Hn0KuPWsTA3qKA2aMhZdehitvuAETmYaug3My4PdMmD4Vcy5YaOWZQZeLGzhO+sl1unr6YBN2b9rmCz+YvqCF7dG77sVTf37AyktxHmRtyJm4oVgYr37fWzF++pQXJe6LYTvCyRezXd167Rte68poqHcedOdCy8+Kh560++xXaJ3hTHve/2IrHGEZjg6J2bB0YTmgk9WOUOgyT7/6A29z9yhks7eLYRlmO/zkn/6KR//wZ7vXfuTkKJOTCM21zHDtzW02Tn3cccwdc4WEJl+Oo0+cPA3Dx4y2zHyyKa+utBha8ZJSm3lUDMVcLpDDrp3bbOq3X6GD5e5dW10lzABux28zBaz7h8qqWhviYlTck01ZRYXFjMlFOQmB8YmO30ObwehE3+Zla7Bh6UpbV0/0DcsCfXD6xuvF9ddz8gMtLU3Yvn2TlZfiThDzH6+N8ewmzxqY2XycncTZsIGI+61s98bNGgrXuHGZKA6D+RVGvd+6aq2dq9U7TLg8LFc5p6eWXH81Lnvly2044mRCa+KSl11l8QRbWhq7pSHTj1HKuW4k18r06zI6rAO3bViPnZtdHnSvu+VBJxiYniXuOkZPnmgz1k42nGE48/y5CEWDvfOgCYScLdHDNTT9CNMn5YRNe3uz3fPuFmjXLrrzHzV6rC1ozdmVJxt+JxfM5hJ4FKMUqYUyYGXYnc6hg/txYP+eXh15v3A8x/kEmmxbnRplXCsz6eb3G65QsLfEcfRxk6cMyE0l7F1wNlzNiGF2E3lzu+H2WSytPmY5+AErGKmkSysnXroloHeMBYURmTld1r3IHzl5sCdYWVeNsspy+3rrbRfI/17j0aM2vNDTQiiOw3tFH4ieWYwvudFnYQBu30mBDRgrPZut1ysPetHXaS3mzN2TZYEuhpaXulHDzE+tZxll/ue+I4cO+rqTREfzhsMcgnPn3DON3D4KU/qeDhsz8gX7XfUHZ1jTl4bWLMbMKk5DdpK4n0uX0Ees/07A6YVDS7ZIe3sbM11+r5c3WXeznqf/ji29MgAFiXmQQpWx3Hi/itOQP8dXTQ3HbAjRjzCNGHqAWqpn+rBNZMd99PgJLq8MTDvM36RPFn11ea965kPCc6TPLLeex/yA7wQWLVQHduxxvaO0FyW2qGJhnK5216vjwqQc2hrIOF2M8TJr4Xnu9zmtvLsVi41DIBs064sffTiY6bi8QDDLYI7dTbZWMFyazlw4d0CdU2PxUkyYNN2cIrmeVGGIwQpqIOcqvVbXM2rp1bMTx2Ga0UeNM3t7Vv9MRlpvB6JheLHQOsXlQZKtnQjnIq6SOX6OPF8K7mAoYNGxB7IMR2MlGDt+kpXXYpHPc6BV7WhzPRJJ/y4EzbqFgZZJsRWYAoHXNHrUBJSVDUz68fdi8RjKy4egtMSzIJgisIMB85NhaAOG4PCjwGLZsaFLd9uDCPOC8kfcMdcQ03+Wa6bOGuB2hCJ44ozplp7dBEA+D7YlmnsNH/oF+vEe2LbHNSjudPP7DPeC/ldwHbxZS85/QTP3ny8cdjz3ksU24Y73rKexgxHe6XxPv20/hk7yncBiYWWcKUZ5ZS+quAGh0Mnl0oiXxzFq4hg7PlCw0J2zaJ5ZCSwAa9F50Ek24O7lkb2HfGke5znR/yWQZjVchLsGWw7DXdPU+XMGVGAxGOm0ubMRcyI50dbRvWC48+A6kGnXA2ZjLPom5ypehhtwVXG3/OcKgT1wKngvy4YPoOXq4O69OLznAAIp5sGic+S9N4EVshl/A9pJcvmbQzTsUPA3i+sSm9mVcg2Fq2dMfPmw98vlWjqSbaxw3L/j586Gmuc/3ZVhzlobKBgYknG1Js2aYb9njaqD6chRBLpPNB9pcOXYfxYYWjuOHqhHpjOLcLDncjjs4HU4gRXD9PPOHeB6sMzdp9mWBymMi7FzcnV02rV5xT5ufoGChnEUeduLyzDzIjt9iGZtyZuBjKZOQwf9uyKlMbR3OIGVz4OExg+ug8ih6vq9B3w5WcB3tTOHjJobmqzhNafDQqXICtBtHDPn6vtdS+YMEHS65cw6RNzPgj3G7vA+s3fpx94bz6n5WJNVxCwOBbxnrmiEc6geXjsg/msFOJ2c05XprMjz6W0FdGfiBBaHWrsNIYouKOzZUBTfQ1KQArQwDMTw2ouFlhfGzmHU766TzWP3nXnBlSvmj4Fccop+NSMnjnP1RL5xK0pGNhKBTADtTW3m85nxmdA36yXrlpzn+1Jc19ECQ4vIyIkDG02dHVhG4mbUdqcGeOPyR1z68XzcfaQrQk+rgh+wduRYg6tbvMkUxfee9Xkqk0AoHnJ5cMSA5kEOpQ4bM9r9PH3o3I5ubRbzYBBtTa35cu4v2FHyLKieW0kBtiu855zsEKERpMi6erLhTGmGoeGahVyrkHm/AH+VQ4fUCs2urvFjTDbf1c68cTbWajf1+OkxWTlQEgpFzMl9IMUV4feHIiEz4/aEP82Nwzd+7HmwMeFMQaZQ72RyKRtw4tVlzIFMQ1rJ2LNh4aO1yu3xDjjow8EKhwIi1ce4uvBg3vLKQhGFe+YePQvWwN3DF4pXhpOuZ+n1KHtmM5btrMuDAz3EaXF1ykrt97wsdvy37KXLlgyDwa1nB+C040444+49Z7+xtHQjnyF4bS82rMBzQesoI+PbJAT3m92LKc8p4EtxRbw8mLaksjzW6zTdDld2QpGBbUuYB+Olno8S82Ev3K60E6l+bEcoXLqEX88kcucdCQ6skcNwX891/RhqiDHcu2dC14pYB5PtSO9OvB/wX/fXYCIWtmLcawqePkTPqYcZa4Az1wvFB6dmjUI/58C7Z6fonrAi7F5xiwLmjGtCmY3scShI+ToSc42DDy1YRtc9PX031/KY+6847YphKnLYyxo3n+VBno51PHL9nb1jgBs3Np4UcNx6/VJhx8CewovChHX++WmFadRPOvEemwuK3zLg84B1fC/xPyB4v+JtPX/P1Y4sJu4/PvoNn9bO/TM4s6LoH93N/rDK1/UiLYX6aEy9hu9UVHCDE6sr3H9/M4f5Ngn/xomdghaFowiWx+xUBv73TiY8Zd/eWnGS8eed9rXA8ntxVuF9kSgBnxMKrJ5hLKzRyBeMXutLihPHTFzc8q/9hN1s7+npwn7e/derLs7v8MVgwqDGJa51nk7zjR7EsAPg/fmPQWfBEuJsgcNXfcXIsYEPVylHS/zp5C7OHAr6Sc3/ACKR+iJhAvozEVU7C+FTKLBS7q+nG46NDLmNAf5864MlBj30wQqHQzYhpvdoZKFRk/QSoj9UOwvhWzw3XRtB6Ia3L1YSBVeWF2KgoLjvy8++IK+kr4ToHwksIXxLP94FeWsCVzSQBUsMGC7bMaSKifgeKp+vCpsQom9UOwvhU9h4FS8zU8DzwWIQw4GPByfOXiz/hYJdsYaK8V65d3CWofKgEH0igSWED/HiurAZ66Px4m63hUL+XItQnCG4vGWzVPsZhjaRpewnRL9IYAnhMyw8QyrlLV7qmQqOYw2a2+keucSHhgjFgJEX8r3yoBDieaHaWQifwcjine2dSLgNGcYbLzYTeHHd+eeFaZAJQQwQLmsFgiGXx0J82g9SYEL0hwSWED6DS+QkOzqRchvbrl7NV37OvIVpKFqvU4iTSwDB5/KxMgHGY/3LLyHOZlQ7C+EzzILV0YHOzk7TUj2bL8qrnGv0YnEFGhUDjOkniSghXgiqnYXwGVwAO5VI2uaZr443bl5Tl+Pkrfxiz2r4xMBAXRUKBREq5LEeplTLi/1Zt4QQElhC+I6Ck3uPdQgLFDSXLfasBk4MJC5/MY95IW97YhLLeyqE6IUElhA+w2YRJhJIdxYsWD2bNvfatWthziKUwBIDiC3mnOs+zaIY5T4h+kcCSwifQR+sjo4EEp0J94piqo9mjEOEDDQqHywxYLh8x7FoObIL8YJQ7SyEz6APVrK902YSkp5Nmzdcw/UI1eiJgYPZyyK5u80zZeXh02z+kW9SNhSiTySwhPAZXhysDnR2JAoRGbrjGrSctXBCDDTMgH1lwjwS+UL0iwSWED4jl8sinUy6LZE3DnRvxAoWrOdo9oQ4KQRCIdssD0pLCXFCSGAJ4TNotUqnU8hwFmHx0EwREldiwAkEQBc/umD1kw2luYR4DiSwhPAZFsm9M4lkImliq/coDHdIYolTAfMawzR0x+ynFF7c7D1CiJ5IYAnhMximIdHZ6URWopeO4jFkuRqhiq44dfSWUN4eZk8NVgvRN6qlhfAZ2UwWCTq5u81ruo43b7RuBXIBRAMxV3hVfMXAQctUKBxBMBTOi6iCkOKjN8mCa2HKgiVE36iGFsJnUEQlOmjB6nRNl2vMCu2Xe5pz7RqtV9FIVMvkiIHFZS8OAVqotefKasqGQvSJBJYQPiOby9nwoK1FWAStCFmnsCisorEoggwCKcSAQwUlFSXEiaIaWgi/4QQWZxF6axF2b9gK/i5ch7AP73chThrMXUEn5hXQVogXhgSWED6DgUY5i5AWrJ4OxIzyTmEVjkTU8ImBxWWvYDBom2XD7lnRUA4Uon8ksITwGYVZhLYWIfVUoRlzz+mfFXTCKhqPe0uYCDFQ5Fy+sy3/uifMlvIDFKJfVEML4TNowUp0dDiBlZ9F2KWv3B9nEdIHqyQmJ3cxsLjsFXAinlshDxLmyYLmUg4Uon8ksITwGRRRnW2dSLQn8nuOk+UQoWvWorGYnNzFgELxRB+sYKhgQ+0ppwr+WZJZQvSFamghfAb9rNLJlG20FRQ3X7RisdGLRhWmQZwKnKBncNs+KEgr5UIh+kYCSwifweaM4Ri46DODinZrwvKNHWcRysldDDS0XSmfCfHCkMASwnc4EZWlv1Vvy4GJrmAA4RhnEar4igHECasAhbxFchdCnCiqoYXwG9RXmYz5YuUC7kXBgJDzRBctCtG4nNzFAOOyF/NYXxYsznTlH0WYEKJvJLCE8B05ZLMZZNzW03SQoVUrEEQsFvfiEwkxUDDv9ch/XVBYmbiSwBKiP1RDC+Ez6GbF2YIFa1UB7u8epkHFVwwczHuhUAihYMh8sbrhMiONqxaLTVYsIfpENbQQPiSHrG094dAMG74IZxGqYROnHeVBIfpDAksI32HeLfmN/xdwryiw3J9mEYpTArOYspkQLwgJLCF8hies8hasno1bftjQLFhychcDictenKnKfHZc8ndHGl+I/pHAEsJn0ErFOFiUWMUKiz5Y2VzGdkXjUTm5iwGFltJgmJHcncjK7+vChqo9HyyJLCH6RjW0ED6iEMXdHNz5V9x4BY47vsvJXZwKLNBtb8NVF9JWQvSPamghfAQXek52JJDLZF3hNImVP+JwjR3DNFBYxeIK0yAGGJf1gqGQbT11Vi7rNrfTE/mSWUL0hWpoIXwEI7WnUknP18r9dTceuFeM5O7as0iUkdzVsImBxBNQnpDvndeY/wIM4aBsKESfSGAJ4SPoZ5VJpz3rQF/F03xfNItQ+APlQCH6RwJLCB9hFqzOFMcKzTJQ3IDRmpWlAnM7w5pFKE4Vz5HNuocREUIUI4ElhI+g71Wys9MTUsGQ23O8deMzNmiBUAjReNwJMBVfMXBQ4Fskd5sp2FNIsQOQs+P2RiFEL1RDC+EjKKwSiU6bLRiihaqoYaO4YvCGgGvTYiUxObmLUwK9AYuFfhe2W+JKiP5QDS2Ej+BagzaLkL5WFFicvpWHRi2zYLn9YTq5a4hQDCh0Ynebiai+hgJ5rE/pJYRwSGAJ4SNouUol0/Y8yCjaPVovhm4Iup1ycBcDDbMYhwe58UVXjnNKvyC3CseEEL2RwBLCR1gUd5tF6F7023AVNXZCDCAWiqGPfGj501BOFKI/JLCE8BGcRZhMcogwSxNWfm8BesOYDSv/WoiBhbYq76+YfL604WsJLCH6QzW1ED4im815PljukUOExQ0Yly0pDBGqYRMDj8trwbBt3XMb5ZbbAnk/QSFEn0hgCeEjzMk94QSW+2MU7eLRGW9fyG1h17ipYRMDC7MYRX6QIqrbbNbCf4F8HlVeFKIvJLCE8BFcizDR2Qlksgj10XB5TsfywRKniL+R0ZQThegfCSwhfASd3NOJlFkIvOGX4w0YGzNbG46BsNSuiYHGCfzCYs/McMdtWA6XT5kFzbolhOgTCSwhfAQFlq1FaM2Za7wK7RdfUnSxyJplSw2bGHhs+M+2/I4eFA4LIXojgSWEj/DiYKUsont3B2InufJOxYzgrjZNnAqyJvU921VfeS7r9nq2LCFETySwhPAR5uROHywntIrXGiw0cZFYxDbN3hKnAs5Y5TBgn7nN7ez3mBBCAksIP+E5uXtL5fTl3xKLxxAviZsvlhADCYcHuZgzfbC8EWpP5pMs/zPxJX9AIfpDtbQQPoLCKpVI2BCha71c25VvvdxLPouWlCBaWuIOqeiKAcb0lPuPebEvCrv7OSzE2Y5qaSF8BIcIU4mkNVoWaLTLOkBPlwCisZjb4mZdEGJAcVksEAq5rTgfFnAZ1O2zIULlRSH6RAJLCB/hzSLM2GNxw2VGAvcyHA4hHHGNnho1cQpgPiv2BewGs6DyoRD9IoElhI+wIcJUPkxDj9LJfeFoBJFoVAJLDDieuOKW31FM1h3npnwoRL9IYAnhI2yIsLPDNV5eJPfi5ovPYyVxxOWDJU4VFFC25V/3oJ/dQgiHamkhfAQXe+5MJpHhC4qogoUgx38BRONxRDWLUJwiaKGiLyClfrGvu1lYeSys4Woh+kO1tBA+IocsUrmEa7yyPaxU9MkCYqUliJWUSGAJIYTPUS0thI+gkSBL+1U/s7OisQii8ajN3hJioPlbucwGsZUVhegTCSwhBhGhcBhht5k5S4jTCLOgsqEQ/SOBJYTvYKtV5PDi8PxfAghHNItQnFqY07pPt2Du9P68oWrlRSH6QgJLCB/BpspzKe7ZaHmCK1ZSaj5YmkUoTi3dBb+JLpmwhHhOVEsL4TMCLJbd2zODbVmsNIZ4mZzcxekll3Wby6M2w1AaS4g+US0thI+wCO75v2IKeisej9tiz3JyF6cW5reeViz3Z/lQeVGIvpDAEsInFJbJCfRhvfIIIByNui2GfpcvEUII4QtUSwvhEzyBle5yaO8Gd7pd4UjYNjm5i9OOy4IS+kL0j0qHED4hl80hlUjaOm+9ca2Z01iRKONgRfJDM0KcJnJZ6wIEQlRZ3i4hRHcksITwCTnXaCU7k+ZAzFar+0ihZ8GypXLidHJXqyZOI6au3L9Ab39BIYSHBJYQPiGbySLR0YmAObp3h2KLozHxMi32LE4zzIz5TUPVQvSPamkhfEIuSwtWwnvRo+GyV+6/iBZ7FqcY01JO9LMDwEkYmUwGabdlXX5FTgJLiP5QLS2ET2Ajlk4kPWtVl5nAg1GzuT5hNBa1LSjLgThFOEmFtmwbWpqb0dLYhJYmtzU3obW1BYmOdhvaFkL0RgJLCJ9gAiud9l70IaC4KxQOaS1CcUqJOEFfPbQONcPrUDWsLv98qHtei7LKIQgGQ/l3CiGKkcASwidQYKWSKT7xjFfHDVgGR2OCkTCCTmTJ90WcKoYOHY4rrn05rn7dq3DV62/AVW94Ja69+UZc9dobMGfJBYiVluTfKYQoRgJLCJ9An5ZkotOe9yWgcshPjZe4EqeQEePG4IZ3vRk3fuAdePV734rXvP9teN2H341XveetWHDVpSgpL82/UwhRjASWED7BnNw7Ck7u3sNx6IXl/QlxKglHI6isrUZlXY231dagqq7WHksryjWjVYh+UMkQwidkszkknMDiCGFPheUOCSGEGERIYAnhE2jBSqWS9rznKCBfhhB2jyqyQggxGFBtLYRPsFhDnEVo4qq7wgrkAk5gybldCCEGCxJYQviE4lmEPWUUfa9CoTCCWlxXCCEGBaqthfAJXiR3ziJ0csoprC63q7zg4kLPQa1BKIQQgwIJLCF8AsM0mJO7k1PFQ4EUWtwXjkS0RI4QQgwSVFsL4RNy2ZxnwfKmER5/dHgWrKiiZgshxCBBAksIn5At+GA5eg0Euh1cJiegIUIhhBgUSGAJ4RecwMoU1iLsAxNYmkUohBCDAgksIXyCxcFKeHGwugXCyg8VhiJ0cleRFUKIwYBqayF8gjdEmCx2vTLspfsvSh+skIqsEEIMBlRbC+ETGAcrnU4jYHMGu8OhwWhp3AksObkLIcRgQAJLCL+QdQIrlUGOw4M9fK1oxYrEYhJYQggxSJDAEsInMFp7NpNGoOcYIXF6y4YI5YMlhBCDAtXWQvgFp6vo6N5rgNDtD7gtHA4pkrsQQgwSJLCE8An0wcpkMnzWIxyDZ9EKx6IIKNCoEEIMCiSwhPAJJrBSmV4O7obbGYvHENIsQiGEGBSothbCJ9AHK4O0LfRcjOeSFUAkrlmEZxW8757xsm96TIQQQvgLCSwhfENeYOVfHYd7Aog5gcVo7uLMJ+D+zFrZp4byckg27fJKXxMihBC+QAJLCF8RQDDgmtce1olAIIdoTJHczxa45mQkFrUampbN7jBSGtDR1oFMqv+llYQQpxfV1kL4Btot+sC1pjwS1GLPZw0U2F7U/t4WKtPeuRxaG5u6FgcXQvgPCSwhfEIul3X/9xZQ9MliMxuOxjSL8CwiQGulE9QcBiweCuR+Lqu0Z8t2tDW35PcKIfyGBJYQPsAWeu5MAtRYPUVWvnGNxTiLUALrbCEcjmBIRbWp654Ci6/XP7sSh/fuR6Kj0/KPEMJfSGAJ4QOyroFMdiZMYPW2YXl7onEt9nw2ESspwcQZ02y4MJNhxvDyAf8PBoJoa2jGikeewMpHn0RbS6sdE0L4B9XWQviArGtA21vbwVFC2iqO2ytIDq49RUl5GcLhcH6fONMpr6zA3MsWWy2dSadMaBXgbNKsyyx333Y7bv/O/2Hr2vVIyx9LCF8hgSWED0in02g+1sixIM9eVTQkxOGgQDiIippKi+Yuzg5owRo3YyIy0TTSWSeeiocJndii2A4kgb3rduCPP/wVGuqP5I8KIfyABJYQPiBjAqvBE1hFlgrCafq5QBaReExDhGcRvNcVVVWoGVYHzh5NJZPdLJscJiwpKUMmmcHWVevctt78sYQQ/kC1tRA+gA3jns3bPGsVxwOLca1qKBq2GFj9BHIQZygVlZVYeOkViMVK0NzYaMFFu3BCPBKJIBqNofloA+7+4S+waeUaJDqdyCqydgkhTg8SWEKcZiiqWhubse7p5ebsXhzriq/JhMlTES8psefi7GFIdRUuueEajJszGdHKGFK5lFk0u+BQoRNZkVgMm5avxnc+/SU888Aj2LNtJ44dPIxUIpl/oxDiVCOBJQYGpxEYUsAb7mKDoB51f3S0tmHvth1oaWq09OoaInQPJrBCAZx3+cUor6z09ouzBq49OWH6FLznUx/HWz7+94jXlSCZTnQvTSxr4RCiTmQd2XUQ3/m3L+GbH/4X3Pq1b2P5w49j9+ZtJraYz9KpVJdoP5vxaqSBr5NYlrV+6NmLBNbZhivwuWwOB3fvs0CFA7Ud2LnHhioCoaC3fl5BNIguaLmi79XuTdtw789/Y740oeJZgu4+ZbNplFSXYNaF81FaUZY/IM4muAblxBnTseSqK3Hta25CKB5GMtVh+acYNuTRSAzpthT2bt2Jx+65D//5j5/Cl//uY/j5127Bw3f+CasefwabVqzB9vWbsG/7TjTWH0XKia6e33UmQ9ETioRMbB7cvbfP+utkbft37EZnewcC4d7LX4kzn8DNsy6zksWbb8suuIJ2+Y3X4fUffS+qh9XZm04lh/cewPc+/VWsffJZJDoSiJeWmO8JKwA6eXZ2dOCchfPxoa99GmOmTMx/amDYuXEzPvmGdyHbkTE/h0IlxEbRpRhe95F349JXXYvaEcNsv184evCQq0z/iDu+9QN7XdxoM1p4JpfByHFjEY4M3Iw0rqfH+3V43wHzL+IQBvcRVuj1+/Zj8rkz7T7OWnSBOxf/hB9obWrGfbf9Dr/61veQzbh7Hz9+75PJBKKlMXzsP7+E8y6/yPa9UJiPWhqasOLRJ/GDL30dyZak5TPC8sgGIJNJY97li/Huz34CQ0ePtGN+p62pBeueWoZVjz6FB359t+0r5EGW5ba2FkQqYvj323+ICTOm2f6BIJlIYPmDj+NbH/2MhTCIl5V2BeRkHqQgefu/fcTdxyWoHlprQ21+hsN9e7buwB3/8z08dM8fUVlSjUg46tlheggkWqmy2YzNTuUbKNKisThCsbBr7N19iAYxfPhoLLjyUiy+9grUDB/qdYTOENqaW/HAHX/Ab275EQ7u2ouqOt5fLw+yDuzs7ECsJI7ho0cjHB2YepC1nbWr7h4c2LXHvfbWGS1geTAYwkf/64s496IF1tb5iV0bt+K3//NjPH3vg1ZWitdBZdkqrajA53/xHYybPjm/d2DgeXzt/f8PG55ZiaEjR3prdDoy6YzVnzXD6/DSN70GN7z7ZgyprbZjpxIaE775kU9h1/rNx8PouPs8dupkWbDONuhAHcgFsX3tJqxfumJAt50uw2WSaRu6KK5YhEdnezs2rVzttlXWy+25kHPaiatsMIdJ58x0lW9pfq84W2HDMnzsKMxecAFGThiLRDaBZDrZZxR35qWI60CVlJSacGxznYb9O3e5cr8Rm1esxcZnVmH908ux+vGnbRhx5SNPYuOzq3Bk30FruM5kWAfG46XIJjOWHn3VXSdz2+F+g9Zo1YFnHxJYZyGsfEtcb6lsSMWAbSUV5YiWlHgLFKti6QWtxVtWrcev/+8HuPeXv0UgG0AolO9huz/62aQDaVSOqcHcyxa53mK5HRNnNyVlpVj40svx6ne+DUNG1ToRnkIqkUAq5YSWrWV5HFpdudEXktYGjkgMHTUcw0eNwvARo8x6svrxZ/Cjr3wT3/745/Cjz/8HHvj1Xdi+fgNam5vPaF8t1km0qjI9+6q/TsZW6jbWg4xn1rPzJM4OdNfPQli52Myj6MBuNMlLXPWG4orm7p9+8VvYvnwTgskAoqGYpRUbRA5DNrUeQ83oWrzuve/ChOlTz6jhG/HC4VBN3YjhuOLVN+CjX/ocFl91OWpGDQWiAZdvkjYsz2Ftl5Hyn/DKO2NqcfiCVi0OQ0ejcVdGowg5kZVLZNDW2IId6zfj17f8EF/98Mdx3+13mg/RmRxXi2s6qh4UA4kE1llKd4+NgaHgtyQ8Mq7ha2lswtqnnsGPvvAf2LV5m6uAY4iXlVtlz0bRljtxybbg0stwzU03Yf5FF2l4UHSDYTzKKsoxe8H5eMe/fQyf+M438P7P/QsmnjMdoZKw+VhSpCcTnUimkuaHRdFFi1TBqmXfY8IrZHmQPpJhJwZo1Wrcdwy/+I//w3f++Ut46i8PYP/u3eZzcyaielAMJBJYZyEs8Kx00663O2AbHbRZsecr9bMRXntnRyeOHa63MAwbn12JP/38Dvz3v30Oe7ZuRyzuGrWw69269zKNaNnKusZx3sWLcdP734mXvem1qB0+TL1f0Se0vtSNGoEJ50wzR/WP/OcX8PFbvo6XvPp6DB0z0iZjBONBl3+8vJhJpS2PcaO1i3VAN7FFi47LjzEnuAJu99Y16/DNf/00vvGJT2LlU0+Zz6D7gL1/sMOryLprYR3VZ/11srZ8PSiRdXYigXWWYRVtNoPh40Zj9JSJGD15YLYxkydg2JgRrtLOL/FxhlQwXJ6EkwQ423Xnxi227di4uet5174Nm7F55VosvfdB/PI/v4svvecj+OK7/wG/+e8fovVQsw3T0HpguKThYs9B17gtuOpyvOGj78HMBfNQUV2loUHxN6E44gy0URPHYfai8/C6j74bn/zef+BLv/w+Pvfj7+Ct//IPuOw1L8e0+XMwbOxIVNRWIlIWdh/0ZrLRf6u4I8Tv84YS44ikwtixYjNu+eJX8dTDj6KTUeIHObzWZGeHe5ZzddSogasH3fdypvuwsaPcb+YsPI44u1CYhufgTAvTYPeYlWk0h/d95pMYMXaM7R8ImFZ7OaX8v39gj1V1da537ImFwRymgY+soMuqKxCORVwV3b8jcC7jesidKfNjYb7l50LBsM2q5L0w3GMhP82//EK8/G2vdw3h7K6pyIMRhWnwD8y/HJbmdPb2ljZLk0w6hbbWVqx7cgUeuvMeHNq/DxUVlYiXlJpDvMvk+U97sEPWmUtg1JzJ+Jev/ztGjx+fP+JfnitMQ9pdf339QQsv8JaP/T1GjBu4epDlnLG2vv+5b9iMastj+fRVmIbnh8I0iEFDljON3F2fOGu6CdWB2macPxejJ02wCpvxe3rOcBqssMKkyNqzZQc2ugLPQs/HvrYty9diz+YdaDnW7ApeBCWlZRaPqEtcFcE93DikUBBzQrxY2DBW1tZYZ5TCffbi8zH34sU4/9KLMO+SRZi18DyMnzHFGv5ke6dXVvOfLRAOhRHJhbF7wxasW7bCGyocxLB8JRKd1kGaNHug68FzLe1ZtlWuzz4ksM4yWNBPxZLBDJDZ6nrO9Puw2FsD/ounDorG6tpaDB89BiNHj8WIfrZho0e53tUwlA0pt0aqzzRwlS57sQzNsOLhJ/Hb//0J1rtG7PC+/a531mi9NCFONpF4zATA2z75Ybzzkx/DjPnn2koBtHilLeTDcTHA58y/0WQId373xxYFfrCvcRjsqgUHtl7ixJZWV46z6TM35IXoHwksMTC4+pmVy5nYa6MFypvyHjFflefaOCxhvlZ9WK0K8BDN74y8vf7Z5fj6P/0z/vdTX8HdP/wFtq3Z4A3dC3ESYX5jrKbRkydgwZWX4ENf/zQ+8q0v4uIbXopAyFtFoLjs0vcwFoygfut+3PPjX2Dfjp35I4MTT1oNrLgiTEPWg+LsRAJLiBPFtTt0Sqd1if5TJ7Jl3WeKHYoLeKLNCbZwFMmjnVj1wFO4839+iv/71y9j3dJl5n8oxEAQjcdt0su5Fy/Ea97/drzkNdfbMGE6Rd/A4wRDrrMQDGHl0qexbcNGNBw+0us9QojjSGAJcYJQIBHzx+ITiqW/sbn/81vOhmG86fJJE13FS52YpSAaR6y0xBbK5ozE73z+y1iz9FmJLDGgMCjm6Mnjcc2bbsS5SxZYyBDmz2KfQXYCkk1J/P7/bsVvvvNDNNTX548IIXoigSXECUBzPwM9Tj//XCy69gosftkVWHjN5X9zW/RS93j1pZh7yUKMmjTeZuHUHz6I5oZGJNo7PCFWBP28oq7B4+zVQ9v24fZbvosjBw/ljwoxMHA4m/nzitffgEAsgGQq4bLm8bzpzSTLYe3KZ7Fy2VNob2vzDggheiGBJcQJwNmQFFgM7jj34oVuW4Rzn8c29xK32fOFmLPkfJyzaD6mzjsHdaOGIVISQ0eqw6bDF2CjxmaN4Q1CuSC2rd6ALSvXoa25xXuDEAMEw5KMmzbJ5c3htsIAhwGLRRZ9l7g4eUtDs02Tp0VWCNEbCSwhTgALFhjMYcq5M3H+FRfZtuCqS//mdsGVl2DB1ZdhyctfiuvfdTM+8JV/w4e/+jm87C2vx6yLzke8ttRilPU1a5Bxs3IdWfzpJ78ykcV4RvQBE2KgqKiqxMKXXG6xmVqaG20CRoFgIITySAVy7TnsWr/FxJYQojcSWEKcAGZXCgRQUl6KiupKDKmuwpCa579V1dVg6KgRGDNlAmacPw8vf8fr8Z7PfQL/+NUvYcKM6XmR1d1xOMQ4ROEItq5ej/vv+B0e/9Nf0NrUlD8qxMnHBJbrEMRrStHa2dxtJpzNQCwbgnR7CuuXrnSCvzV/RAhRjASWEKcJLoPD5XAYL2vO4oV416c/hnMvWmgO8IVFnwtYBOhADvf9/k78/tZbsWf7jj6tXUKcDCxAaU0NxoyZgGFDR7k9XoBdQqf3WEnMOgN7Nm2zlQqEEL2RwBLCB3AG19R5s/G6D/8dJs+ZiXQ2jfb21q4ZhhbGIRRFNBPDkW2H8MCv/oCmo8fsmBADQawkjknnzMTEGdNsdmuxwGLngHmTyyJJ6AvRNxJYQvgEBiXlEkbXvet1KKkrwdGmw0hljgcZDQWDqBhSiWQygWVLn0BrS3P+iBAnH1pNa0YMRfXQOo6Kc+aFd8BhQTrdawszUrRfCHEcCSwhfAStBpNnz8ToKRNs4VI61Xc1YLRiuUaPr5uPNaLpWIOiRIsBg5aqaCzatbhubx11fNhQCNEbCSwhfEZFVRWuuP4GXHrNtQiGgt2mwbM5CwciCKfC2LFmEzrbBvfCu8K/2HIyTmRx66WjzKTl8uPxGKRCiB5IYAnhMyoqK3Hxy1+KC6+7CtGKWI/4WFmEwyEE0jmsfOhJ84ERYsCgsJKRSogXhASWED6DVqvSinKMGDMKk2fMNH+XwvI8bOy4HhzbvD1btyPRqRlcQgjhRySwhPApQ2qqMX3eHIs7ZAFO83DIhuM3rR0tNlVeCCGE/5DAEsKnMIp23cgRZsHyFs7xKPjFIAskOxPHrVtCCCF8gwSWED6FEdxjpXHPobiHlzFFV8DpqnQy3c26JYQQwh9IYAnhU7jQbjjiTZG3McE8lFMmqXKBXgvxCiGE8AcSWEL4Fbpa5afD90fWrFcSWEII4TcksIQQQgghTjISWEIIIYQQJxkJLCGEEEKIk4wElhBCCCHESUYCSwghhBDiJCOBJYQQQghxkpHAEkIIIYQ4yUhgCSGEEEKcZCSwhBBCCCFOMhJYQgghhBAnGQksIYQQQoiTjASWEEL4kEw6g6Yjx3D0wCEcO3i4azt6wD0eqnfH0/l3CiH8iASWEEL4kJaGRtzz41/iZ1/9Nm792rfx86/fgp9/7Rb87N+/hV9+67toqD+af6cQwo9IYAkhhA9pb23Dsgcew6O/vxeP3XUfHr/7fjx+z/149K6/4Mm//hVtLS35dwoh/IgElhBC+JGc27I5BNxDIBA4vrn92c6MHRNC+BcJLCGE8CFOSyEYDiEcjSAcKdrCEQQDIb7De6MQwpdIYAkhhA/J0VKVzSHHzb3o2mjakvFKCN8jgSWEEL7ESalsJv/8OLmAE16BrCe0hBC+RQJLCCF8i3lgeU+LyLo/IYS/kcASQggfQvtUNtufpUr+V0L4HQksIYTwIZwtGOhHXKniFsL/qJwKIcSggqKrL+ElhPATElhCCOFDTEZJRwkxaJHAEkIIX5KzsAx9ubnLxV0I/yOBJYQQPsVzcO/LjCUndyH8jgSWEEL4FAYZ9cRUT0GlsUMh/I4ElhBC+BYKq/6sWEIIPyOBJYQQvkXCSojBigSWEEL4EM9uxf/7GiLs+VoI4TcksIQQwo9wYWcu9MznvfSULFtC+B0JLCGE8CvSUUIMWiSwhBDCp+RyfUe80gChEP5HAksIIXxKf0JKhi0h/I8ElhBC+JT+hJQElhD+RwJLCCH8iFNRXCpHckqIwYkElhBC+BCTVl2R3HsiLywh/I4ElhBCDDKCsmoJ4XsksIQQwpfkkM1lEehDTOVkwRLC90hgCSGEX+nTUBWQvBJiECCBJYQQgwrzzvKeCiF8iwSWEEL4EaehuFBObylF+5VsWEL4HQksIYTwKxamQYJKiMGIBJYQQviVrtHA7nas3lYtIYTfkMASQggfwiCj2WwOgQDcJguWEIMNCSwhhPAxva1V3CPBJYTfkcASQgghhDjJSGAJIYRP8ZbKEUIMRiSwhBDCp+SQtf+7w+FBCS8h/I4ElhBCDDJUcQvhf1ROhRDChzDEaDablbFKiEGKBJYQQvgUDgZqvqAQgxMJLCGEEEKIk4wElhBC+JGc+8fhQZmwhBiUSGAJIYRPYTT3vhRWTqpLCN8jgSWEEH6lXx1VMG8JIfyKBJYQQvgSm0eIXKAvISVxJYTfkcASQgifQonVp5bKBSyEgzeEKITwIxJYQggxCJG4EsLfSGAJIYQP6ZJP/fhhBeToLoSvkcASQgifkrW1CPuAI4c5RnmXFUsIvyKBJYQQPqU/GxX3ez5Y3mshhP+QwBJCCF/COYT9WLC6kMISwq9IYAkhhC+hl1XfNizOLsxxIWghhG+RwBJCCJ/Sl32KkotDg3LBEsLfSGAJIYQvMTtVL5EVCDiJ5f55AUilsITwKxJYQgjhW3IIUk9RVBVDXaURQiF8jQSWEEL4kIJ9qm8bVU6zCIXwORJYQgjhQ2iz8tzce1ivhBCDAgksIYQYbOTXIpQJSwj/IoElhBCDESeuervACyH8ggSWEEL4lP4GBymrsrJeCeFrJLCEEMK3PJf/lRNY0lhC+BYJLCGEGERQUzEEVjbNWYRSWEL4FQksIYQYdNB6JXElhJ+RwBJCiEFI1oksObkL4V8ksIQQwpf0739lxqssrVjeayGE/5DAEkII39KfyArIeiWEz5HAEkIIn/IcNqy8C5ZElhB+RQJLCCH8SD9O7BRd3izCNHIcJhRC+BIJLCGE8B05ZHNcCif/sg+ovySvhPAvElhCCDHIoLCSD5YQ/kYCSwgh/IanoJ4TGx5ULCwhfIsElhBC+AzTV/2Kp4D9UVxJXgnhXySwhBDCbzjllM38bR8sKSwh/IsElhBCDDJou8pktRahEH5GAksIIXwGBVQ2k/FCMtj/fSFxJYSfkcASQgif0u8ooNuZy2a9J0IIXyKBJYQQPuQ5fawYafRUiCvPhCaEeAFIYAkhzlz+ljigirEt/9ov2GnRQtX3JXDYkP5X8sESwr9IYAkhTjqBgJMFgaDplr4kAEXDgIsD9/XZtOfH1Bc8xVA4bJu98BkF36veqeTt4bUNZBqaI306bVsvCj87cD8vxKBHAksIcVIJhoKIl5chXlqa39O9FQ64aieQDaCztd0cuQcKCoOWhmb79UDQJJ3t93DPgznESuPuPEsQDPqrKuT5RuJR5Nw59ko/Jwapq5qPNSGVSOb3nnwyTsA1H22yNOSQpInmPBRfPCveax9qUyF8gQSWEOKkEo5EUDdyGGpG1rkaxhMDBdgsU8zk0sDerTuR6Ejkj5x8Ojs6sXvTVot4bgKqx3lkghnEykpQUlZmQsFPUMzQskah1XMoMEDLoHu9e+M2tDW15PeefJKdCezeuhV7tu/wosbnhRR/O0Nh7M4xVhJ356hmRIi+UMkQQpxUwtEIho4ZidrRw4FIwdbhQZ0QDIWQcw306iefRVvLwAmEjpZWrH92JbLZrPebRSKF7k3xWAkiEU/E+JFwKIzK8moTht0EFkVXNoNNK1eh8cixbsdOFvzOVndvtm3eiN3bt9g9LFj5eCydTCHsBOAwd58jsajtF0J0RwJLCHFSofWFVqyI2zh8VHDWNlzjHHJiJ5vNYfOq1ehoa8sfOPmkUikcqT/kTui4OCA8H57X8FFjUFJalt/rPyhUa0YMM18sS8O8DrQhQvfX0HgUHe2tNhR6skVW2qVdw6EjSDR3IpdyZxAoaircb3FoMuLOb9TE8YjF4/kDQohiJLCEEAMCBUL5kErTBd0sMHmB0HysAU1HGszX52RDAXBw9173mLDfK4anQtEyfMwoJ7AKfmL+IxKNom7kcCaYCdIuheXgsBytSHs2b8PuTdtsOO9kkujoxN7N25HpSCMejSNYJLB4JslUAsFoCMPGjZIFS4h+kMASQgwIlTU1mDH3XKcPug/PkVAwhGwyh3VLl6G9tTW/9+TR5MTbY3/4M3LJLEKhcH6vB4cMWfNNnTcLQ2qr83v9R7ysFFPmnuMSy/N5KhaKvKacS7/7fvF73PPj23HkwKGTZsViANNjBw7jqT/9FZ1tbSivHIJg0TAq068z0Y5ISQSTZk+3SQJCiN70FlgsR907fEIIccIMHTUCC6+6DDR+9JzqTwfuXC6DP9/xa2xftwHJzs78kRdPZ3s7dmzchGVPP4mcEyU9ZwhSrEQr45ixYK6vBVZJeSmmLZiDYGUEmVy624xLXhN9sXZu3ozljz+BNU8/g4629vzRF0d7axtWPP4Udm3Zhmwui2hJzCxmhCKO/nNDhlRj2IhRqBsx3IaDhRC9CXbv9bjn/FfkMiGEEC+E0vJyjJs+BbWuEe65MLH5aYWjaDnQhF//1w+x+rFn0Fh/tJcQOxFSySQO79mHJ//8V/zoK99EqimBSC/rlRMpwRzmX7gYtcOGmT+YX6GIqh02HBcsvhjRqEur5sZuIisciqCqus7CNfzy+z/A+hXLLQ1eDPz8hpUr8btbf2ZpFY3Hu1nOKE5zTti95Kbrcc3NN6JqaG3+iBBnM31bj10Z9qb8crPAdu7fQDhNCiHOLmhhoQ/R1W94tYmFdA/xxH0UCRufXY1ffet7+M0tP8L2tRvNwfpEoTBYv3QFbvnnL+H7n/4GDm/d58RV1ImD49Yr1mkpdw7xulJc/cbXDApxUF1Xg2ve9GrUTBqGzlwnUhmXhvmq2ROpYcRCMTTvPYbvfelrWPHkU2g6euyEhGo2k0V7SyuOHjqMle7z3/vy19C8v9EEcLG4YvplsinUjK3DkuuvxKKXXo6yyiH5o0KcnbBcZFP5jo8rLwXpFI6GEQyFQ56wIp6+8gSWOVUKIcQLh8Nc088/F/GSEi/yONXB8TYbVv84obVl1To8+Ou7cdcPfmGhB06UIwcP4fZb/hdrn3oW7U2t5iBOAVeAQoHCLZNK49zzF2LkuLFeBHefw3McMXYsFlxyGWbNOw+ZZNqJnO6TAnidFFlHdh7Ej77+H3ji3r+i+Vhj/ujfhkOqm5avxr23/wY//sY37Xv4fcWO7STjxF0qkMJLXnU9Js6c4e5tWbc0FuKshB0Pdnx6EHR1WzAcKa5kOLsn4HqDKfcZjRMKIV4cjD9VO3woJp07E5lg1sRBsVWkYIVJO+HDIcJNy1Zh1ZNP49Ce/c/LCsPZgjs2bMaKx5/E1tUbkE4mzWeIwq0YWmn4G+FwBFNnnePr2YM9oRP5OfPm2oQB+jtRJPaEQieYC2Pn2k1Y9ejTWPbw4+aXdXDXHiT7ivbuGoVkImHHVz2xFCseeRKr3eMO9/lgzjUMfQintGtEyqsqMfXc2ahwj0IIz4LFGb2s1byazetEMsZeMO56mNlAfoiQ5i33R3MxKyQhhHixVDuBdcN7bkbF2Boksgmb4m+WrDwcSuRMNQ43HT18GD/75n/hvl/e6QTTeuzfsRuH9+5Hw+EjZpXh8NeR/Qexf/su7N68DRuWrcSvv/0D3PrNbzsFQL+virzT9XERR7+h9rZW2zVh5lTMWbLALGuDhdLyMsxefAEWXHUpJpwzzYROXz3maDiKilg1lv/1CXzv81/Ddz71Zfzp1juw8dmV2Llhi0uv7ZZm3Ph6w9IV+POtv8b3v/B1/Pnnv8G2FRtRHq103xPLf6Mjn4y0/gUywPxFF2LMxAmIxYveI8RZDOuXNmomVmn5IUInqbwVIoZUV9sLE1iciut0VYPrSb4QPwghhOgJA1LOmD8Hr3/3u1A7fhha0s1IZDq7RBY7drQ48X3RaBzth1tx1/d/ji+9+yP4xgc/gf/7l6/gjv/6Hu750e34/XdvxY+/+C18/f3/jM+/9UP46gf+Cc/c/yjSTWkTBnRaL7aQUYgkkp0IlAUxZdE5uPmfP2CO97SsDRZ4rmWVFZi1+Hy8+RMfwIipY5Do7PQsWazN8/C6o+EIQsEgsokM6ncewL0/+w3+/X3/hM+88X343Js/iM+/5UP43M0fwKdvfp9Lu4/jz+54y6FG1wZ4/nARl4bH0y9nw7qMscVRjSnzZuEV73gT6kYN75pVKMTZDsOWdKQ6rDNiRipXJjkSWFFdhWDtyGH2JsY+sYNOYR2rP2RRkIUQ4mTA3tyFV12Bd3zkI7jhbW9BrLYMnemEhQEohkNTFEpB99fZ3Im9W3Zh7VPL8cAd9+AP37sVf/zJr/DsXx/F/u27bSHidHvalpSJRno7ZKdSSSSTSQyfPBof+OK/4SNf/QLOuWC+CbnBCNf9m3nBPLz305/AuCmT7fooHlPp5PF0dGlAv62YE6rRiBNLLh0ziTQ62zrQcqwJzQ1NaGlqQaLVCTS3n/630WjMhjNCRQs38/sSqQQ6OtoRDAcx24m7t37ywxb3ajD4rglxKmA9w0DJNFIVoJZi54TrsQaHjxttOxkp2Coot3GmTTpNP6yiT51q+NP5zVOEfMLXtoPvOCV4v+z+eA5dm7ff7/AcvSQrnHf+dX47FXi/U/T7brPXXcf8C8/S+3PPC+d+ik/aSyfvt4+fQ3471SfzImDdUllbjQsuvwQ3vvNteMc/fQRVY2qcAOq0IUOGBLBr895sjXg0FjUxROtWIdAlBQEXZuYMHR7r7szuuofue9KZFBLpTqfWgHMWzMcHPv+vuPjaq82xne8fzPD8z1l4Ht77lX/Bope9BCV1ZUgFkkglEyYmLYhqHqa5Zxl06ejSkunJcA/c+Jr7zVftuC61zycpTN0WqyvFkhuuxhs/+n6841MftcCsgy7mVVdZ4UO+DPG5bfn8dgooLreF87DXp/AcXhB2msfP+fi589ipOn/3m/n/7a9wHu7P9rqHU3UmPeFI37GDh5FLUz+5He6/LE/IPR82fgyCdaNG2AtLNHfQylomh7bmlm4xV04dLsFcIc9kuGXMxM9Hmqp5PvQN4wxHO98Bhr+QzfEcem75cyqqzHyFO3EKZkszJ5Z7njuvaaCzo2V/d48s/Vyj1+0c3Hll3H4e4/sG+lxeCLy3dp490pANeMb17k/JGbsf4WQTplUhz3Xb7D76NA/2AYUQrTC1I4Zh4WWX4uYPvd+JrlocPVKPtlZvTT1SbInic3PgDoVMdHlii5YWV1fl31d4nkln0dbUiqP1h9GSaMKlr74Wr/+Hd2PavDmIDyKn9r8FhdGUOTNx4/vfgb/7t0/g5Te/waVJGEcPH/KCjbpyZ2lWnE5MquPJas8Lx+y4g2E0uMBzff0BVNZU4e0f+zBe+8F34ZJXXYMxUycNMnGVr39ce8F2g3mrq9zwOQO3YuDrQWLn4X6rW9nNb9zPo7xnvsOdktWDXW1xj3O3TlH+vQMIf8LSj3Vh8e8X6md3HqerLeYkm/p9B9wJUmB5Ia8sXUI5DBs9AsHKulrkXPnqmjXoChufNh9t7BW35pTAm8obaonnCkKqaONrS9BTlZjM+jyXHufhNhMv7jxOhdA7USxDunNLu0zImVPdzp3nbRXLAONOwhNY7tdYAIrTkM9dBefusC/Tz/KgSz+rmIvTLn/ux4XhQHM8/aw89DgPCixfpt/fgA3/kOoqnLtwIWYvOh/jp09CSVmJqzTTaO9o8/yLXNr3TOJiMVCAnS3O4OFQVjKZQGlFGYaNHY1p8+dg3sWLMWXurDNyMWJaoMbPnIr5Fy3GeZdchFkL52PctEkmYJkWbW2t6Gh3adKZsF62lXs2SvmNr5luCXe8w6V5R3ube18SZRXlmOTEG53q5114ISZMn4qa4UOduBp8w4LsZHZ17vqof9zRgS/HrEtcGbVOUvE5FM6DjTENBvm3+wmelQnUnufNjR0+6+CdijNnO+zSj21Gz/tIgwG30ySwzIJ16Iirh736idjddM9jpSUIfeLj/++zD//ubqfEUl4PhTfbvXvEuDGYPHumFdhTSWd7B7auXmeVA/02KmqrUV5ZaU6eJa7wlw4px1jXmzrv8iUDPlWYVryVTz+FklgZhlRVoWyIN9OpbEgFKmqGYJarhFiplZT5q3fMhVoZ0frAzj2uwqywqdU873Km4RB3LSOrcenLr0Nl9cAtE8JK/OiBg9i5ZYvLbEDt8OHufrk0dOdRUlmGSFkUY6aMx/mucagb6ZR+yD9Os3To3b9zt0u/Xa7B5r2utnvunXs5qkbWYNGVl7keyqj8JwYGiuNjh+uxdd16lJaVd6WflQV3HyuHV7nzeAmGjhrpq/R7vkTjMUyYOQ3jp05xFaarQLNpJN0f0q5CZeNoFWdeEFAYFBpLtz9NwWn76DvqslgkiMqh1Zh36YW46GVX4bo3vQ7T5s6x9fx6irIzBV4X6+yqoTWYdt4cTHRpSXHa1NJgx82K5S6dlT9HBQqWfxPlbBeZbi7fBGMhROL8nlrMdaL0pg+8Exe+7ErUjhhqlsPBCMsO67+Du3dbPKKaYcO66sFSV4YjZRGMmz7ZlZ8rBrYedOnOMrx59Vorw3YO+XaE5zFkWBUWXHmplWG/WQhbm1qwd8t2tDQ02fkW0s/O3XVkqkfW4eKXX2OdpYGk1bXD61euMp/DumEjzHncO4dyC2FSO3I4ps6fjannnnPK9QpnNj/067txaPdeK28k40QXNcEVN70CgV2btuY+e/MHbFX7WIm3aGcmncK08+fgg1/9tBNano/WqcLi4Rw+gs6ODqsIiiMxs6bgvlhpHNXDhmKgnVUZHfrQvv02ZGq1UQFWUO4l1zFjj89vTp9U9m3Nre7mu4rWTr24gXE7QgEMd+JgIP1RWJl3tLWh8ehRE+/B4PHZXbyHbEzZwNYMrbN856dGkL221qZmSz+71UXnxnMPhgNOMA4b8GEnVs7scDQcqnfP8z6SeaxsuLaPy9AwiKef0u9E4HXQytLc0Ggdg9amRqx+dCnWPrUC+7btdGXQm23opJR1/ryhrRD4x5hWQ2qrMH3+HMy5eCFGTxrvKvtKuy8MwzBYxcELoSsdXZ5tcXm3lc7sbjOR4TYGb01YneqEl0uXuNWhdRjl0mzCzCmu8axy5TFqISEqa2sG2XBgb1h22pxAYL6ilaFb/cP8lElZY1w3YsTA1oMuwRnI9agrwznXjvQuw6xLhnplON9A+wUOf1FAdLS29WhDvHMPhYMYOnrkgKYfYTt85OBhqx+4SHxXGrpz4H1m+8tOJ8v+qS7zezZvwxfe/g9oqj+KkCszFg/Lnd5419n56H99AYGDu/bm/ucTX8TG5WssIzK+iT1WluAzP/o2Js2a0aXMhBBiIKG4peWYsfhYoRZcF2yYxXW+gq5BCobCTmd5w4WsXBlRnNZZDpsNVqF5MmHjVxgGpEWLwotpx8aIMI3YmFNExUpiZgWwNRmVdkI8byimNq1Ygy++5yPIdmYsPEpLYxMq62pwxWtfgdd84B0IuB25e2+7E7//7k9Rv3c/quiTZVaPHN7z+U9gwVWXocIpQyGEOJ0UQslICAghTjcHd+3FvT//Nf70sztcdy/oOjAZ1B88gInnTMP7vvCvmHfpYgTp5zRt/jkIljv1lWwGV703i5Xr7Kx7eoUtXyGEEKcbG0KRuBJC+ACuLrHmiWeRS1MzeQFG6RcaikZs9QpaiG2xZzqNcQyY45scn2Ylxjfv27HTpk8LIYQQQpztmJBKp9HutBEnMHDAz4kmG/njxLuq2hobeqe13ZyrGMl3zJiJGDVyPAJZ91b3zlzACaw9O3H00CGtTSiEEEKIsx76XnF91EN79qKzo92EFEUXrVizFpyPuRcuQml5ub039FkHZ+bES0oRjcWwe8tWt9spr0AQ6QRjTHDV9SSGjRnRNctQCCGEEOJs49jhw7jrh7fhiT/dj5ajTTbRhhatYCSI69/5Rix52ZWoGTbU7Q95FizG+Lngyosx/6olCFfFkM5mbForp5U+8Ls/4I+33e7U2r6uWShCCCGEEGcTFFIHdu/BU489hFUrnjGXKs5opiGqum4oxk6eZDFECyGkTGDRqZ2BscZMnIALLrrY/Ehp8uLU3WxnFvU7D2LZg49bXBEhhBBCiLONhvqjuO8Xd6JlfxOGxKoRDkVs9iBjIzI0w+gpEyywbWEyjgmsAsPHjMZF112NXDSHdJYxZ8IYUl2NjvYOPP6X+9Dc4EUIFkIIIYQ4m6Bj+9oVyywIa3l5hRmnOHMQ0QBmLJiLqrqa/Ds9ugksBpwbPm60haCnSzxFGFdedxINh/fsx8Hde83BSwghhBDibIFBe3dt2oqWhmZzbKfvFWcQcpiwbuRwW2qq5woI3QQWKS0tw4zZc5F1H6LPVSDorXeVTWSx9L6HLVKpEEIIIcTZAIMc08j0l1t/65QWEAnHzI2KC2HTELXoistRUdk7IHsvgcU1/q57++sRq4kjlUnZl0ScwOKSgI8/cB+2rd9oawMJIYQQQpzptLe2YcWjT2LzmrUIOTEUDnESYAbpTBqVo2ux+GVXWAysnvQSWOFIGGMnT8SSy6+0BXuTFFP2hVF0HunAz//929i+ViJLCCGEEGc2XBN1ixNWv/vZT5FNZ2yReQ4LJpIJC83wire8EaMnjkcw1EtO9RZYpLKmBle+9gbUjR+OtPtLpDptKmLEiay9W3bgTz/9FXZt3IpEZ8JMZ0IIIYQQZwpcLL35WCPWPPEMbv/Gd9G8pxGRcNTEVXt7m6mnyefMxPyLL0RpeVn+U93pU2AxQNbYKZNw7RtvRLQigiNHDyCTTdt+hAJY9sTjWPfMMhzYsduCkAohhBBCnCm0NbfgmfsfxiO/+xO2r9toSwkyAHsmk0Z94wFEa2O45q03YdjY0d46qX3Q915HvLQUU+fMRu2IEYhEY6bmCGNjNTc2Yc3y5Vi/cgU62tttvxBCCCHEYCebyeDYwcNmSNq0ag1SiRSC9LvKeSGsqkcMxbgZUzF5zgzESuL5T/WmX4HF8cSho0fgwstfgvkLFwMZ98WptBNYYUSDUTx+3/2461e/wsY1a5BMJPKfEkIIIYQYnFBENR1rwLOPPIZljz+B3du3IRKLWMyrdCplURWuffVNuP51b0BVTW3+U30TcF/mLQbdBwwL39rUjA3PrMTt3/wu9mzdjni8xKKUJjNJpJFBzbhheP+nPoG5CxciwphZQgghhBCDDMoh+l09fu99uO2W76DjSBsiwagZlujgnkwmMP/yJbjx/W/HpFnTEYnHTHj1x3MKrAKd7R3YsHwlvvOFL+PorsOIhdyXBoIWJyuRTaBm4jC8918/gTkXXIBYLO6+Nf9BIYQQQgifw2FBWq6euO+vuP073zVxFS1oHXcskejA2CmT8Z4v/DOmzJ2JaCyW/2T/PC+BRRiuYeXTT+N/Pv8VtOw55kRW1PvhnBNZmQSqxg/FO//xHzBj7lyUVZQjGo8/p7ITQgghhDid0L+cDu1HDh7Csocfw+9+9jMkGjqdxombrSiTdeIq3Ym6icPx/k/9K2YvPP95j9aFPuvIP39O6NxeWV2DQCiI5U8+DqRziEU8BRcKhNDa2IRtWzYiEgwhGo5a0K1wfkVpIYQQQgi/Qe2y9L5H8Ng99+Lhe/6E9qOtiIeduAoEQetTR2cbsvEc3vH/PoLzL7kIsXj/Tu09OSETU0lpKeacNx9jpkxEJphFm/thGsBoyQq7v10bt2DlY09h5eNPY+eGLbYgohBCCCGE32AQ0c3L12LVo09j/dIVqN+933yuGPeT4RjaO1qQiwQw+dyZmHXB+RZd4UR43hYswgUOKbLKh1Rg777daGg6CmQ9CxZjRPBv/87d2LF+ExoPHUHdqOEYUlONcDgsvywhhBBCnHYYIL29pRWbVq7GHd/6HtY8+SxaGhpREi+3pQHpX55MdyITz2Hy3Jl40wffh0nTp9tI3onwvH2wCvDt7S0t2LdrN9YuX4G7fn47mnfXIxaMW7Atqj6OafIChk0ahTf+w/swfd4cVA+tQySmWYZCCCGEOD3QasWFm5c98hj+cOvP0by3AaFgxEJT0VCUoUN7qhN1U4bjpve+C7MvOB9DLR7oieuXExZYhvsIFR6DjG5YuQrf/+LXUL/1AMLhmK1laI5h7iS5WHSkIor5ixbj0lddi9GTJ6B8yBCzap2oEhRCCCGEOFEYcqqh/ijaW1ttmb97b/2NrS+YzWRt+Ru6OVEKMc4VDURjpk7E2z71D5h53twTHhYs5oUJrCK46PO6Z5bj1q/cgl0btiAXzJl4Coc8B/dUOmknnovlUD2sFhdcdAkuueEajBg7FpW1Nd7yO0IIIYQQJwnqjlQyhcYjR3Fw9x785bbfYu3KZWhtbEYgEXCiyumUSNjeZyNvXA4wGsHcRQvxqve9DVPnzkLkRU7Ue9ECiyQ6OrDmiWdxz09/gScefsCpxDYMrx6FeKzEjqedekylvWjv0ZI4KsdU4/Jrr8PL3vx6J7Kqbb8QQgghxMmAK88c3L0Pd//kNix78lG07G+ytZPpSx4NxzzjjpM/bW2tqG86iJoRQ/GyG1+Ly1/5ckye8/ziXP0tTsjJvT8YOn5ITRXaWlptZiHHMjPtGWTTWYRDIXchYXMcc5oRLU1NOHhgn3nqlw0pR/PRRjQdPWZDjvHSEsXOEkIIIcQJk0okcHjvAezZvMNWntmyeh2e+OP92Lh6NUK5MEpLyxGLev7i9BNPuPdTr1SPG4pp82fjsuuuxTkL5p9QKIbn4qRYsAh9rpqPNqCpsQFbV63DXd//BQ5s381fsOHCgnDKuIviYokW2qEkjPKyCnMgm3PRApx76WJUVA4xocUFFCnc6FgWol+XU51CCCGEOLuhbEknUyao6DfV2dGJjrZ2M9Ysu/9xrH7yWTTU1yPR2YFsMoOc6ZCw0yHegs3UKxwSDIZDmDx7Jq59y42YNHsGqmprUVpeftIMPSdNYBXg1yXaO7Bv+y48fu/9+Ovvf4/2w60WzoEaiWv6dF1kOu0esxZzAk5FBuNBVFXWYtI5MzB22kTUDKtD3agRqBpaawlBUUa1GQi6T7gvs88JIYQQ4oyEWqGwURjZYyqNI/sPmrXq2KEj2LN5G3Zu2Iy29lbkkjlzXnefMKHEoUDqBTqvZ52o4uepIapGD8Ur33Ezzr1wIYaNGWVGnZPNSRdYBXiBrU1N2Lt9Bx789T1Y8fSTaDrSgABjj2Z4gbzwvGXKnQGHCBmS3l292+eElIko9173iLDb3It4JI6SsjKLEM9E45RKIYQQQpyBuKafYoriiA7rba2tSGUTphlyKSehsvn3Of3AZfsCoYDF5aS+IDTgFMJGcV8wFrT4nIuuugILX3oZxkyaYJqCgmsgGDCBVYAXR7NdW0sLjh48bBFTH73nXrQebUTO9BQFFfUTRZUTTLxQt89Oy20UXt4J8jXfV0gI7h2YRBFCCCGED8ixnWd77/SA+9+TAPTodv870WSjWW7L8QANNU5Y5GjEsePuWMSJquEj8JKbrsf08+egqq4WFVVVKK8cYiNiA8mAC6xikokEjh2sx74dO7FjzSY8evdfsHH1SouoGg3GUVZegXhZqU2NLChQz8LlnWJBdNlz+18IIYQQZyRs6J0E8DQVnxQ5BlFU5fUADTH0x+poa0Nbe4sJrCFV1Zi9eAEufdU1GD1pvG1DaqvNt/tUcUoFVgE6p3Hdwgd/ew/WrViG5oZGZDtzSLYnLJEYk8LS1SUgY1UEmaimVL19XfC5lJYQQghxZsGm3tr344085Qo3G9niY857pOyiyxH9qKLlUYtaUFVbh7kXL8YVN70CQ0ePOGmO6yfCaRFY/EmGq29paEJHexs62ztQv/cg1j65DJuWr8bRgweRzqTc+9wJZgqCqiu1u9H3XiGEEEIMati4UxcVGnk+FkmCXMibPce4ViPHjcHMBfMxe8kFqKqrsThWnBHIEFL02z4dnBaB1ZNclhFXk2hrbkFHa7t7nkAqnbZpl0f2HbR1gxoOHTFBRjHG2YdZTrNMpSxxhRBCCHEGYRaWoIVpoq8Uh/bokF5RU4m6EcMwbMxI1I4ajlhpia0eE4vHUFJehrIhFccn0J1WgP8f0N0ANJeathoAAAAASUVORK5CYII="/>
                  </div>
                  
                </div>
              </div>
            </td>
            <td class="qr-hucre">
              <canvas data-qr="{$qr}"></canvas>
            </td>
          </tr>
        </table>

        <!-- Satıcı / Alıcı / Belge bilgileri -->
        <div style="display:flex;align-items:center;justify-content:space-between; width:100%">
          <div style="width:100%">
            <div class="unvan">
              <xsl:choose>
                <xsl:when test="$sat/cac:PartyName/cbc:Name">
                  <xsl:value-of select="$sat/cac:PartyName/cbc:Name"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="$sat/cac:PartyLegalEntity/cbc:RegistrationName"/>
                </xsl:otherwise>
              </xsl:choose>
          </div>
          <div class="kucuk" style="margin-top:4px">
            <span class="etiket-kalin">Merkez : </span>
            <span>Sırakapılar Mah. 1583. Sk. No: 11 / 20010 / Merkezefendi / DENİZLİ</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">Sanayi Şube : </span>
            <span>Akçeşme Mah. Bozburun_1 Cad. No:6 Merkezefendi / DENİZLİ</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">Telefon / Fax : </span>
            <span>0258 372 17 77 / 0258 372 12 16</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">Web Sitesi : </span>
            <span>www.nakosantextile.com</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">E-Posta : </span>
            <span>info@nakosan.com.tr</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">Vergi Dairesi : </span>
            <span>PAMUKKALE</span>
          </div>
          <div class="kucuk">
            <span class="etiket-kalin">VKN/TCKN:</span>
            <xsl:text> </xsl:text>
            <xsl:value-of select="$sat/cac:PartyIdentification/cbc:ID"/>
          </div>
          </div>
          <div style="width:100%"><div class="rozet">
                <img class="icon" width="90px" src="data:image/jpeg;base64,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" />
              </div>
              <div style="text-align:center; margin-top:4px">e-İrsaliye</div>
              <div style="text-align:center; margin-top:4px">İl Kodu : <b>20</b></div>
              </div>
          <div style="width:100%">
            <table>
              <tr>
                <td width="80px" style="border:1px solid #5b2c40; padding:2px">Özelleştirme No</td>
                <td style="border:1px solid #5b2c40;width:4px">:</td>
                <td style="border:1px solid #5b2c40;"><xsl:value-of select="cbc:CustomizationID"/></td>
              </tr>
              <tr>
                <td width="80px" style="border:1px solid #5b2c40; padding:2px">Senaryo</td>
                <td style="border:1px solid #5b2c40;width:4px">:</td>
                <td style="border:1px solid #5b2c40;"><xsl:value-of select="cbc:ProfileID"/></td>
              </tr>
              <tr>
                <td width="80px" style="border:1px solid #5b2c40; padding:2px">İrsaliye Tipi</td>
                <td style="border:1px solid #5b2c40;width:4px">:</td>
                <td style="border:1px solid #5b2c40;"><xsl:value-of select="cbc:DespatchAdviceTypeCode"/></td>
              </tr>
              <tr>
                <td width="80px" style="border:1px solid #5b2c40; padding:2px">İrsaliye No</td>
                <td style="border:1px solid #5b2c40;width:4px">:</td>
                <td style="border:1px solid #5b2c40;"><xsl:value-of select="cbc:ID"/></td>
              </tr>
              <tr>
                <td width="80px" style="border:1px solid #5b2c40; padding:2px">İrsaliye Tarihi</td>
                <td style="border:1px solid #5b2c40;width:4px">:</td>
                <td style="border:1px solid #5b2c40;"><xsl:value-of select="concat(substring(cbc:IssueDate,9,2),'.',substring(cbc:IssueDate,6,2),'.',substring(cbc:IssueDate,1,4))"/> || <xsl:value-of select="cbc:IssueTime"/></td>
              </tr>
            </table>
          </div>
        </div>
<!--         <div class="ozet-satir"><span class="ozet-etiket">Ettn</span>: <xsl:value-of select="cbc:UUID"/></div> -->
        <!-- Alıcı Bilgileri -->
        <div class="ozet" style="width:100%">
          <div class="ozet-etiket"><b>SAYIN</b></div>
          <div>
            <xsl:choose>
              <xsl:when test="$alc/cac:PartyLegalEntity/cbc:RegistrationName">
                <xsl:value-of select="$alc/cac:PartyLegalEntity/cbc:RegistrationName"/>
              </xsl:when>
              <xsl:otherwise>
                  <xsl:value-of select="$alc/cac:PartyName/cbc:Name"/>
              </xsl:otherwise>
            </xsl:choose>
          </div>
          <div>
            <b>Adres</b>
            <xsl:call-template name="Adres">
                  <xsl:with-param name="adres" select="$alcAdres"/>
                </xsl:call-template>
          </div>
        </div>


        <!-- Belge özeti -->
        <div class="ozet" style="width:100%">
          <div class="ozet-satir"><span class="ozet-etiket">Ettn</span>: <xsl:value-of select="cbc:UUID"/></div>
        </div>

        <!-- Kalemler -->
        <table class="kalemler">
          <colgroup>
            <col style="width: 2%;"/>
            <col style="width: 30%;"/>
            <col style="width: 13%;"/>
            <col style="width: 10%;"/>
            <col style="width: 10%;"/>
            <col style="width: 15%;"/>
            <col style="width: 10%;"/>
            <col style="width: 10%;"/>
            <col style="width: 10%;"/>
            <col style="width: 10%;"/>
          </colgroup>
          <thead>
            <tr>
              <th class="orta" style="text-align:center">#</th>
              <th>Mal / Hizmet</th>
              <th>Açıklama</th>
              <th class="orta">Order No</th>
              <th class="orta">M.Sip No</th>
              <th class="orta">Boyahane Renk No</th>
              <th class="orta">Kg</th>
              <th class="orta">Mt</th>
              <th class="orta">Adet</th>
              <th class="orta">Top Sy.</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="cac:DespatchLine">
              <xsl:variable name="itm" select="cac:OrderLine/cac:LineItem/cac:Item"/>
              <xsl:variable name="ek" select="$itm/cac:AdditionalItemIdentification"/>
              <tr>
                <td class="orta"><xsl:value-of select="position()"/></td>
                <td><xsl:value-of select="$itm/cbc:Name"/></td>
                <td>
                  <xsl:value-of select="$itm/cbc:Description"/>
                  <xsl:if test="cbc:Note">
                    <xsl:if test="$itm/cbc:Description">
                      <xsl:text> | </xsl:text>
                    </xsl:if>
                    <xsl:value-of select="cbc:Note"/>
                  </xsl:if>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='SIPARIS_NO']/cbc:ID">
                      <xsl:value-of select="$ek[cbc:ID/@schemeID='SIPARIS_NO']/cbc:ID"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='MUSTERI_SIPARIS_NO']/cbc:ID">
                      <xsl:value-of select="$ek[cbc:ID/@schemeID='MUSTERI_SIPARIS_NO']/cbc:ID"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='BOYAHANE_RENK']/cbc:ID">
                      <xsl:value-of select="$ek[cbc:ID/@schemeID='BOYAHANE_RENK']/cbc:ID"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='KG']/cbc:ID">
                      <xsl:value-of select="format-number(number($ek[cbc:ID/@schemeID='KG']/cbc:ID), '#.##0,00##', 'tr')"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='MT']/cbc:ID">
                      <xsl:value-of select="format-number(number($ek[cbc:ID/@schemeID='MT']/cbc:ID), '#.##0,00##', 'tr')"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='ADET']/cbc:ID">
                      <xsl:value-of select="format-number(number($ek[cbc:ID/@schemeID='ADET']/cbc:ID), '#.##0,00', 'tr')"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="orta">
                  <xsl:choose>
                    <xsl:when test="$ek[cbc:ID/@schemeID='TOP']/cbc:ID">
                      <xsl:value-of select="$ek[cbc:ID/@schemeID='TOP']/cbc:ID"/>
                    </xsl:when>
                    <xsl:otherwise>-</xsl:otherwise>
                  </xsl:choose>
                </td>
              </tr>
            </xsl:for-each>
            <xsl:if test="count(cac:DespatchLine)=0">
              <tr>
                <td colspan="10" class="orta">Kalem bulunmuyor</td>
              </tr>
            </xsl:if>
          </tbody>
        </table>

        <!-- Toplam - bu ekranda şu için gerek yok diye kaldırıldı -->
        <!-- <table class="toplam">
          <tr>
            <td class="toplam-etiket">Toplam Tutar</td>
            <td class="deger">0,00 TL</td>
          </tr>
        </table> -->

        <!-- İmzalar -->
        <table class="imzalar">
          <tr>
            <td>Teslim Eden<br/><br/>Ad Soyad / İmza / Kaşe</td>
            <td>Taşıyıcı<br/><br/>Ad Soyad / İmza</td>
            <td>Teslim Alan<br/><br/>Ad Soyad / İmza / Kaşe</td>
          </tr>
        </table>

        <!-- Alt blok -->
        <table class="dip">
          <tr class="dip-bas">
            <td>Açıklamalar</td>
            <td>Taşıyıcı Bilgileri</td>
          </tr>
          <tr class="dip-govde">
            <td>
              <xsl:choose>
                <xsl:when test="cbc:Note">
                  <div>Not: <xsl:value-of select="cbc:Note"/></div>
                </xsl:when>
                <xsl:otherwise>-</xsl:otherwise>
              </xsl:choose>
              <xsl:if test="$topKg &gt; 0">
                <div>Not : Toplam <xsl:value-of select="format-number($topKg, '#.##0,00##', 'tr')"/> Kg</div>
              </xsl:if>
              <xsl:if test="$topMt &gt; 0">
                <div>Not : Toplam <xsl:value-of select="format-number($topMt, '#.##0,00##', 'tr')"/> Mt</div>
              </xsl:if>
              <xsl:if test="$topAdet &gt; 0">
                <div>Not : Toplam <xsl:value-of select="format-number($topAdet, '#.##0', 'tr')"/> Adet</div>
              </xsl:if>
            </td>
            <td>
              <div>
                <span class="etiket-kalin">Taşıyıcı Firma:</span>
                <xsl:text> </xsl:text>
                <xsl:choose>
                  <xsl:when test="$nakliye/cac:PartyName/cbc:Name">
                    <xsl:value-of select="$nakliye/cac:PartyName/cbc:Name"/>
                  </xsl:when>
                  <xsl:otherwise>-</xsl:otherwise>
                </xsl:choose>
              </div>
              <div>
                <span class="etiket-kalin">Araç plaka numarası:</span>
                <xsl:text> </xsl:text>
                <xsl:choose>
                  <xsl:when test="$plaka">
                    <xsl:value-of select="$plaka"/>
                  </xsl:when>
                  <xsl:otherwise>-</xsl:otherwise>
                </xsl:choose>
              </div>
              <xsl:if test="$nakliye/cac:Person/cbc:FirstName">
                <div>
                  <span class="etiket-kalin">Sürücü:</span>
                  <xsl:text> </xsl:text>
                  <xsl:value-of select="$nakliye/cac:Person/cbc:FirstName"/>
                  <xsl:text> </xsl:text>
                  <xsl:value-of select="$nakliye/cac:Person/cbc:FamilyName"/>
                </div>
              </xsl:if>
            </td>
          </tr>
        </table>

        <table class="sayfa-alti">
          <tr>
            <td>Bu e-İrsaliye simülasyon ortamında oluşturulmuştur.</td>
            <td class="sag"></td>
          </tr>
        </table>
      </xsl:for-each>
    </div>
  </xsl:template>
</xsl:stylesheet>

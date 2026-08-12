-- Tedarik (ihtiyaç) ekranı: kumaş × renk bazlı ihtiyaç tablosu.
-- MANTIK.md m.82-84: migration geçmişi eksik -> sqlcmd ile elle CREATE TABLE.
-- Prisma model (schema.prisma -> model TedarikIhtiyac) ile aynı şemadır.
-- NVARCHAR: Türkçe karakter (örn. gri renk adları) kaybolmaz. SQL Server CAST/DECIMAL desteklenir.

IF OBJECT_ID('tedarik_ihtiyac', 'U') IS NOT NULL
BEGIN
    DROP TABLE tedarik_ihtiyac;
END
GO

CREATE TABLE tedarik_ihtiyac (
    id                  INT IDENTITY(1,1) NOT NULL,
    siparis_id          INT NOT NULL,
    siparis_kalem_id    INT NOT NULL,
    recete_kalem_id     INT NULL,
    malzeme_id          INT NOT NULL,
    malzeme_kod         NVARCHAR(50) NOT NULL,
    malzeme_ad          NVARCHAR(200) NOT NULL,
    kumas_grup_id       INT NOT NULL,
    kumas_grup_kod      NVARCHAR(50) NOT NULL,
    renk_id             INT NOT NULL,
    renk_kod            NVARCHAR(50) NOT NULL,
    renk_ad             NVARCHAR(200) NOT NULL,
    brut_miktar         DECIMAL(18,6) NOT NULL,
    net_miktar          DECIMAL(18,6) NOT NULL,
    birim               NVARCHAR(20) NOT NULL CONSTRAINT DF_tedarik_ihtiyac_birim DEFAULT 'mt',
    tip                 NVARCHAR(20) NOT NULL CONSTRAINT DF_tedarik_ihtiyac_tip DEFAULT 'kumas',
    durum               NVARCHAR(20) NOT NULL CONSTRAINT DF_tedarik_ihtiyac_durum DEFAULT 'hesaplandi',
    aciklama            NVARCHAR(MAX) NULL,
    kayit_yapan         NVARCHAR(100) NULL,
    kayit_tarihi        DATETIME NOT NULL CONSTRAINT DF_tedarik_ihtiyac_kayit_tarihi DEFAULT GETDATE(),
    guncelleyen         NVARCHAR(100) NULL,
    guncelleme_tarihi   DATETIME NULL,
    CONSTRAINT PK_tedarik_ihtiyac PRIMARY KEY (id),
    CONSTRAINT FK_tedarik_ihtiyac_siparis FOREIGN KEY (siparis_id) REFERENCES siparis(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tedarik_ihtiyac_siparis_kalem FOREIGN KEY (siparis_kalem_id) REFERENCES siparis_kalem(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tedarik_ihtiyac_recete_kalem FOREIGN KEY (recete_kalem_id) REFERENCES recete_kalem(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tedarik_ihtiyac_malzeme FOREIGN KEY (malzeme_id) REFERENCES malzeme(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tedarik_ihtiyac_kumas_grup FOREIGN KEY (kumas_grup_id) REFERENCES kumas_grup(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tedarik_ihtiyac_renk FOREIGN KEY (renk_id) REFERENCES renk(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE INDEX IX_tedarik_ihtiyac_siparis   ON tedarik_ihtiyac(siparis_id);
CREATE INDEX IX_tedarik_ihtiyac_sip_kalem ON tedarik_ihtiyac(siparis_kalem_id);
CREATE INDEX IX_tedarik_ihtiyac_malzeme   ON tedarik_ihtiyac(malzeme_id);
CREATE INDEX IX_tedarik_ihtiyac_renk      ON tedarik_ihtiyac(renk_id);
GO

-- Döviz kuru geçmişi tablosu: TCMB'dan çekilen günlük kurlar için.
-- Prisma model (schema.prisma -> model DovizKuru) ile aynı şemadır.

IF OBJECT_ID('doviz_kuru', 'U') IS NOT NULL
BEGIN
    DROP TABLE doviz_kuru;
END
GO

CREATE TABLE doviz_kuru (
    id              INT IDENTITY(1,1) NOT NULL,
    tarih           DATE NOT NULL,
    doviz_kodu      NVARCHAR(10) NOT NULL,
    alis_kuru       DECIMAL(18,6) NOT NULL,
    satis_kuru      DECIMAL(18,6) NOT NULL,
    efektif_alis    DECIMAL(18,6) NULL,
    efektif_satis   DECIMAL(18,6) NULL,
    created_at      DATETIME NOT NULL CONSTRAINT DF_doviz_kuru_created_at DEFAULT GETDATE(),
    CONSTRAINT PK_doviz_kuru PRIMARY KEY (id),
    CONSTRAINT FK_doviz_kuru_doviz FOREIGN KEY (doviz_kodu) REFERENCES doviz(kod) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT UQ_doviz_kuru_tarih_doviz UNIQUE (tarih, doviz_kodu)
);
GO

CREATE INDEX IX_doviz_kuru_tarih ON doviz_kuru(tarih);
CREATE INDEX IX_doviz_kuru_doviz ON doviz_kuru(doviz_kodu);
GO

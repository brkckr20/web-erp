-- İşlem / Rota / Rota Operasyon tabloları (Faz 2 backend).
-- Prisma modelleri (schema.prisma -> Islem, Rota, RotaOperasyon) ile aynı şemadır.
-- Yeni tablolarda Türkçe karakter için NVARCHAR kullanılır.

IF OBJECT_ID('rota_operasyon', 'U') IS NOT NULL
BEGIN
    DROP TABLE rota_operasyon;
END
GO

IF OBJECT_ID('rota', 'U') IS NOT NULL
BEGIN
    DROP TABLE rota;
END
GO

IF OBJECT_ID('islem', 'U') IS NOT NULL
BEGIN
    DROP TABLE islem;
END
GO

CREATE TABLE islem (
    id              INT IDENTITY(1,1) NOT NULL,
    kod             NVARCHAR(50) NOT NULL,
    ad              NVARCHAR(200) NOT NULL,
    birim           NVARCHAR(20) NULL,
    sira            INT NOT NULL CONSTRAINT DF_islem_sira DEFAULT 0,
    aktif           BIT NOT NULL CONSTRAINT DF_islem_aktif DEFAULT 1,
    CONSTRAINT PK_islem PRIMARY KEY (id),
    CONSTRAINT UQ_islem_kod UNIQUE (kod)
);
GO

CREATE TABLE rota (
    id              INT IDENTITY(1,1) NOT NULL,
    kod             NVARCHAR(50) NOT NULL,
    ad              NVARCHAR(200) NOT NULL,
    ozel_kod        NVARCHAR(50) NULL,
    hizmet_kodu     NVARCHAR(50) NULL,
    kullanimda      BIT NOT NULL CONSTRAINT DF_rota_kullanimda DEFAULT 1,
    CONSTRAINT PK_rota PRIMARY KEY (id),
    CONSTRAINT UQ_rota_kod UNIQUE (kod)
);
GO

CREATE TABLE rota_operasyon (
    id              INT IDENTITY(1,1) NOT NULL,
    rota_id         INT NOT NULL,
    sira            INT NOT NULL CONSTRAINT DF_rota_operasyon_sira DEFAULT 0,
    operasyon_kodu  NVARCHAR(50) NOT NULL,
    operasyon_adi   NVARCHAR(200) NULL,
    varsayilan_yer  NVARCHAR(200) NULL,
    birim           NVARCHAR(20) NULL,
    birim_fiyat     DECIMAL(18, 2) NULL,
    CONSTRAINT PK_rota_operasyon PRIMARY KEY (id),
    CONSTRAINT FK_rota_operasyon_rota FOREIGN KEY (rota_id) REFERENCES rota(id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_rota_operasyon_rota ON rota_operasyon(rota_id);
GO

-- Varsayılan işlemler (önceki mock verilerle aynı)
SET IDENTITY_INSERT islem ON;
INSERT INTO islem (id, kod, ad, birim, sira, aktif) VALUES
    (1, N'KESIM', N'Kesim', N'ADET', 1, 1),
    (2, N'DIKIM', N'Dikim', N'ADET', 2, 1),
    (3, N'PAKET', N'Paket', N'ADET', 3, 1),
    (4, N'UTU', N'Ütüleme', N'ADET', 4, 1),
    (5, N'KALITE', N'Kalite Kontrol', N'ADET', 5, 1);
SET IDENTITY_INSERT islem OFF;
GO

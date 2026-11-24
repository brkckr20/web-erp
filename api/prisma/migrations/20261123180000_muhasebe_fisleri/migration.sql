CREATE TABLE [dbo].[muhasebe_fis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_tipi] VARCHAR(10) NOT NULL,
    [fis_no] INT NOT NULL,
    [fis_tarihi] DATETIME2 NOT NULL,
    [belge_no] VARCHAR(50),
    [k] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [erisim_kodu] VARCHAR(50),
    [aciklama] VARCHAR(1000),
    [kaynak_turu] VARCHAR(30),
    [kaynak_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_muhasebe_fis_created_at] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [PK_muhasebe_fis] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_muhasebe_fis_tipi_no] UNIQUE NONCLUSTERED ([fis_tipi], [fis_no])
);

CREATE INDEX [IX_muhasebe_fis_tarihi] ON [dbo].[muhasebe_fis]([fis_tarihi]);
CREATE INDEX [IX_muhasebe_fis_kaynak] ON [dbo].[muhasebe_fis]([kaynak_turu], [kaynak_id]);

CREATE TABLE [dbo].[muhasebe_fis_satir] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_id] INT NOT NULL,
    [hesap_kodu] VARCHAR(50) NOT NULL,
    [hesap_adi] VARCHAR(200),
    [cari_hesap_id] INT,
    [ozel_kod] VARCHAR(50),
    [aciklama] VARCHAR(500),
    [vade_tarihi] DATE,
    [miktar] DECIMAL(18,4),
    [belge_no] VARCHAR(50),
    [doviz] VARCHAR(10),
    [doviz_kuru] DECIMAL(18,6),
    [doviz_tutari] DECIMAL(18,2),
    [borc] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_muhasebe_fis_satir_borc] DEFAULT 0,
    [alacak] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_muhasebe_fis_satir_alacak] DEFAULT 0,
    CONSTRAINT [PK_muhasebe_fis_satir] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FK_muhasebe_fis_satir_fis] FOREIGN KEY ([fis_id]) REFERENCES [dbo].[muhasebe_fis]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_muhasebe_fis_satir_cari] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id])
);

CREATE INDEX [IX_muhasebe_fis_satir_fis] ON [dbo].[muhasebe_fis_satir]([fis_id]);
CREATE INDEX [IX_muhasebe_fis_satir_hesap] ON [dbo].[muhasebe_fis_satir]([hesap_kodu]);
CREATE INDEX [IX_muhasebe_fis_satir_cari] ON [dbo].[muhasebe_fis_satir]([cari_hesap_id]);

CREATE TABLE [dbo].[muhasebe_entegrasyon_tanimi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [hesap_tipi] VARCHAR(50) NOT NULL,
    [fatura_tipi] VARCHAR(20),
    [depo_id] INT,
    [kdv_orani] DECIMAL(5,2),
    [muhasebe_hesap_id] INT,
    [hesap_kodu] VARCHAR(50) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [DF_muhasebe_entegrasyon_tanimi_sira] DEFAULT 0,
    [aktif] BIT NOT NULL CONSTRAINT [DF_muhasebe_entegrasyon_tanimi_aktif] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_muhasebe_entegrasyon_tanimi_created_at] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [PK_muhasebe_entegrasyon_tanimi] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FK_muhasebe_entegrasyon_tanimi_depo] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]),
    CONSTRAINT [FK_muhasebe_entegrasyon_tanimi_hesap] FOREIGN KEY ([muhasebe_hesap_id]) REFERENCES [dbo].[muhasebe_hesap]([id])
);

CREATE INDEX [IX_muhasebe_entegrasyon_tanimi_kural] ON [dbo].[muhasebe_entegrasyon_tanimi]([hesap_tipi], [fatura_tipi], [depo_id], [kdv_orani]);

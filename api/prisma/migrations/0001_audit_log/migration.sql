-- CreateTable
CREATE TABLE [dbo].[audit_log] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tarih] DATETIME2 NOT NULL CONSTRAINT [audit_log_tarih_df] DEFAULT CURRENT_TIMESTAMP,
    [kullanici_id] INT NULL,
    [kullanici_ad] NVARCHAR(100) NULL,
    [ip] VARCHAR(50) NULL,
    [islem] NVARCHAR(20) NOT NULL,
    [tablo] NVARCHAR(50) NOT NULL,
    [kayit_id] INT NULL,
    [kayit_no] NVARCHAR(100) NULL,
    [ozet] NVARCHAR(1000) NULL,
    [degisen_alanlar] NVARCHAR(MAX) NULL,
    [eski_veri] NVARCHAR(MAX) NULL,
    [yeni_veri] NVARCHAR(MAX) NULL,
    CONSTRAINT [audit_log_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [audit_log_tarih_idx] ON [dbo].[audit_log]([tarih]);
CREATE NONCLUSTERED INDEX [audit_log_kullanici_id_idx] ON [dbo].[audit_log]([kullanici_id]);
CREATE NONCLUSTERED INDEX [audit_log_tablo_kayit_id_idx] ON [dbo].[audit_log]([tablo], [kayit_id]);

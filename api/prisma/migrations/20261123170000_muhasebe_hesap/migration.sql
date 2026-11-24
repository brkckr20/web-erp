CREATE TABLE [dbo].[muhasebe_hesap] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [erisim_kodu] VARCHAR(100),
    [ozel_kod] VARCHAR(100),
    [aciklama] VARCHAR(1000),
    [hesap_tipi] VARCHAR(30) NOT NULL CONSTRAINT [DF_muhasebe_hesap_hesap_tipi] DEFAULT 'PARASAL',
    [hesap_turu] VARCHAR(20) NOT NULL CONSTRAINT [DF_muhasebe_hesap_hesap_turu] DEFAULT 'BORC_ALACAK',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_muhasebe_hesap_created_at] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [PK_muhasebe_hesap] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_muhasebe_hesap_kod] UNIQUE NONCLUSTERED ([kod])
);

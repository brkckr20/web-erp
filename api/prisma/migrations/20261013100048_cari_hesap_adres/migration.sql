BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- CreateTable
CREATE TABLE [dbo].[cari_hesap_adres] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cari_hesap_id] INT NOT NULL,
    [kod] VARCHAR(10) NOT NULL,
    [tip] VARCHAR(50),
    [aciklama] VARCHAR(500),
    [adres_1] VARCHAR(500),
    [adres_2] VARCHAR(500),
    [ulke] VARCHAR(100),
    [sehir] VARCHAR(100),
    [ilce] VARCHAR(100),
    [mahalle] VARCHAR(100),
    [ozel_kod] VARCHAR(50),
    [telefon] VARCHAR(30),
    [fax] VARCHAR(30),
    [posta_kodu] VARCHAR(20),
    [eposta] VARCHAR(150),
    [aktif] BIT NOT NULL CONSTRAINT [cari_hesap_adres_aktif_df] DEFAULT 1,
    [varsayilan] BIT NOT NULL CONSTRAINT [cari_hesap_adres_varsayilan_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [cari_hesap_adres_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [cari_hesap_adres_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cari_hesap_adres_cari_hesap_id_kod_key] UNIQUE NONCLUSTERED ([cari_hesap_id],[kod])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cari_hesap_adres_cari_hesap_id_idx] ON [dbo].[cari_hesap_adres]([cari_hesap_id]);

-- AddForeignKey
ALTER TABLE [dbo].[cari_hesap_adres] ADD CONSTRAINT [cari_hesap_adres_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

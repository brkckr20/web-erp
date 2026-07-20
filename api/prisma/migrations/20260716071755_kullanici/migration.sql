BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[kullanici] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [durum] BIT NOT NULL CONSTRAINT [kullanici_durum_df] DEFAULT 1,
    [giris_kodu] VARCHAR(50),
    [sifre] VARCHAR(255),
    [kullanici_rolu] VARCHAR(100),
    [cari_hesap_kodu] VARCHAR(50),
    [yetkili_adi] VARCHAR(200),
    [kasa_kodu] VARCHAR(50),
    [departman_kodu] VARCHAR(50),
    [personel_kodu] VARCHAR(50),
    [masraf_yeri] VARCHAR(100),
    [dil_ondegeri] VARCHAR(20),
    [ozel_kod] VARCHAR(50),
    [aciklama] VARCHAR(500),
    [kullanici_tipi] VARCHAR(100),
    [satis_elemani] BIT NOT NULL CONSTRAINT [kullanici_satis_elemani_df] DEFAULT 0,
    [mobil_kullanici] BIT NOT NULL CONSTRAINT [kullanici_mobil_kullanici_df] DEFAULT 0,
    [hizmet_sunucusu] BIT NOT NULL CONSTRAINT [kullanici_hizmet_sunucusu_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kullanici_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kullanici_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kullanici_kod_key] UNIQUE NONCLUSTERED ([kod])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

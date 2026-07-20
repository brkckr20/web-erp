BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[cari_hesap] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [cari_hesap_kullanimda_df] DEFAULT 1,
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [grubu] VARCHAR(100),
    [sektoru] VARCHAR(100),
    [ticari_islem_grubu] VARCHAR(100),
    [cari_hesap_tipi] VARCHAR(100),
    [cari_hesap_turu] VARCHAR(100),
    [ticari_unvani] VARCHAR(200),
    [personel] VARCHAR(100),
    [satis_personeli] VARCHAR(100),
    [satis_kanali] VARCHAR(100),
    [araci_kurum] VARCHAR(100),
    [potansiyel] BIT NOT NULL CONSTRAINT [cari_hesap_potansiyel_df] DEFAULT 0,
    [bayi] BIT NOT NULL CONSTRAINT [cari_hesap_bayi_df] DEFAULT 0,
    [faktoring] BIT NOT NULL CONSTRAINT [cari_hesap_faktoring_df] DEFAULT 0,
    [musteri_hesap_kodu] VARCHAR(50),
    [satici_hesap_kodu] VARCHAR(50),
    [vade_farki_faiz_orani] VARCHAR(20),
    [vade_opsiyonu] VARCHAR(20),
    [odeme_plani] VARCHAR(100),
    [indirim_kodu] VARCHAR(50),
    [fiyat_kodu] VARCHAR(50),
    [alis_indirim_kodu] VARCHAR(50),
    [satis_indirim_kodu] VARCHAR(50),
    [vergi_dairesi] VARCHAR(100),
    [vergi_no] VARCHAR(50),
    [doviz_cinsi] VARCHAR(10),
    [doviz_kur_tipi] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [cari_hesap_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [cari_hesap_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cari_hesap_kod_key] UNIQUE NONCLUSTERED ([kod])
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

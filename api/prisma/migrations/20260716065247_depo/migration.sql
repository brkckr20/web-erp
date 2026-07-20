BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[depo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [durum] BIT NOT NULL CONSTRAINT [depo_durum_df] DEFAULT 1,
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [is_yeri_kodu] VARCHAR(50),
    [negatif_stok_kontrol] VARCHAR(50),
    [kritik_stok_kontrol] VARCHAR(50),
    [ana_depo_on_degeri] BIT NOT NULL CONSTRAINT [depo_ana_depo_on_degeri_df] DEFAULT 0,
    [sevkiyat_depo_on_degeri] BIT NOT NULL CONSTRAINT [depo_sevkiyat_depo_on_degeri_df] DEFAULT 0,
    [sanal_depo] BIT NOT NULL CONSTRAINT [depo_sanal_depo_df] DEFAULT 0,
    [antrepo_depo] BIT NOT NULL CONSTRAINT [depo_antrepo_depo_df] DEFAULT 0,
    [show_room_deposu] BIT NOT NULL CONSTRAINT [depo_show_room_deposu_df] DEFAULT 0,
    [kartela_deposu] BIT NOT NULL CONSTRAINT [depo_kartela_deposu_df] DEFAULT 0,
    [adres_1] VARCHAR(500),
    [adres_2] VARCHAR(500),
    [posta_kodu] VARCHAR(20),
    [bolge] VARCHAR(100),
    [ulke] VARCHAR(100),
    [sehir] VARCHAR(100),
    [ilce] VARCHAR(100),
    [telefon] VARCHAR(30),
    [faks] VARCHAR(30),
    [eposta] VARCHAR(150),
    [gps_x] VARCHAR(50),
    [gps_y] VARCHAR(50),
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [depo_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [depo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [depo_kod_key] UNIQUE NONCLUSTERED ([kod])
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

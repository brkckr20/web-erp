BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- CreateTable
CREATE TABLE [dbo].[sirket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] NVARCHAR(200) NOT NULL,
    [telefon] NVARCHAR(30),
    [fax] NVARCHAR(30),
    [eposta] NVARCHAR(200),
    [vergi_dairesi] NVARCHAR(100),
    [vergi_no] NVARCHAR(20),
    [mersis_no] NVARCHAR(20),
    [e_fatura_etiketi] NVARCHAR(100),
    [e_irsaliye_etiketi] NVARCHAR(100),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sirket_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sirket_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sirket_adres] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sirket_id] INT NOT NULL,
    [baslik] NVARCHAR(100),
    [adres] NVARCHAR(1000),
    [ilce] NVARCHAR(100),
    [il] NVARCHAR(100),
    [posta_kodu] NVARCHAR(20),
    [sira] INT CONSTRAINT [sirket_adres_sira_df] DEFAULT 0,
    CONSTRAINT [sirket_adres_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sirket_web] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sirket_id] INT NOT NULL,
    [site] NVARCHAR(200) NOT NULL,
    [sira] INT CONSTRAINT [sirket_web_sira_df] DEFAULT 0,
    CONSTRAINT [sirket_web_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sirket_iban] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sirket_id] INT NOT NULL,
    [banka] NVARCHAR(200),
    [iban] NVARCHAR(40) NOT NULL,
    [aciklama] NVARCHAR(500),
    [sira] INT CONSTRAINT [sirket_iban_sira_df] DEFAULT 0,
    CONSTRAINT [sirket_iban_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[sirket_adres] ADD CONSTRAINT [sirket_adres_sirket_id_fkey] FOREIGN KEY ([sirket_id]) REFERENCES [dbo].[sirket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sirket_web] ADD CONSTRAINT [sirket_web_sirket_id_fkey] FOREIGN KEY ([sirket_id]) REFERENCES [dbo].[sirket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sirket_iban] ADD CONSTRAINT [sirket_iban_sirket_id_fkey] FOREIGN KEY ([sirket_id]) REFERENCES [dbo].[sirket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

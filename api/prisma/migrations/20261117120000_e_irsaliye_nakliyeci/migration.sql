-- e-İrsaliye gönderim bilgileri ve nakliyeci tanımı.
-- Malzeme yönetim fişleri (çıkış tipleri) için tutulur; diğer irsaliyelerde boş kalır.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[nakliyeci] (
    [id] INT NOT NULL IDENTITY(1,1),
    [unvan] NVARCHAR(200) NOT NULL,
    [ad] NVARCHAR(100),
    [soyad] NVARCHAR(100),
    [tc] NVARCHAR(11),
    [plaka] NVARCHAR(20),
    [aktif] BIT NOT NULL CONSTRAINT [nakliyeci_aktif_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [nakliyeci_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [nakliyeci_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [nakliyeci_unvan_key] ON [dbo].[nakliyeci]([unvan]);

-- AlterTable
ALTER TABLE [dbo].[irsaliye] ADD [e_irsaliye_durum] VARCHAR(30),
[e_irsaliye_no] VARCHAR(50),
[ettn_no] VARCHAR(50),
[xslt_dosya_adi] VARCHAR(200),
[nakliyeci_id] INT,
[nakliyeci_unvan] NVARCHAR(200),
[nakliyeci_ad] NVARCHAR(100),
[nakliyeci_soyad] NVARCHAR(100),
[nakliyeci_tc] NVARCHAR(11),
[nakliyeci_plaka] NVARCHAR(20);

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye] ADD CONSTRAINT [irsaliye_nakliyeci_id_fkey] FOREIGN KEY ([nakliyeci_id]) REFERENCES [dbo].[nakliyeci]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

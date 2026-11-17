-- Bir şoför birden fazla araç kullanabildiği için plakalar ayrı tabloya taşınır.
-- Mevcut tek plaka değerleri yeni tabloya aktarılır, ardından kolon kaldırılır.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[nakliyeci_plaka] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nakliyeci_id] INT NOT NULL,
    [plaka] NVARCHAR(20) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [nakliyeci_plaka_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [nakliyeci_plaka_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [nakliyeci_plaka_nakliyeci_id_plaka_key] ON [dbo].[nakliyeci_plaka]([nakliyeci_id], [plaka]);

-- AddForeignKey
ALTER TABLE [dbo].[nakliyeci_plaka] ADD CONSTRAINT [nakliyeci_plaka_nakliyeci_id_fkey] FOREIGN KEY ([nakliyeci_id]) REFERENCES [dbo].[nakliyeci]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Mevcut plakaları taşı (büyük harfe çevirme, uygulama tarafıyla aynı sonucu versin diye Latin1 collation ile)
INSERT INTO [dbo].[nakliyeci_plaka] ([nakliyeci_id], [plaka], [created_at], [updated_at])
SELECT [id], UPPER(LTRIM(RTRIM([plaka])) COLLATE Latin1_General_CI_AS), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM [dbo].[nakliyeci]
WHERE [plaka] IS NOT NULL AND LTRIM(RTRIM([plaka])) <> '';

-- AlterTable
ALTER TABLE [dbo].[nakliyeci] DROP COLUMN [plaka];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

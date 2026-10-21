BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
-- Prisma "çoklu cascade yolu" kuralı: KK kalemi -> irsaliye kalemi ilişkisi eklenince
-- mevcut FK'ların ON UPDATE CASCADE aksiyonları NoAction'a çekilir.
ALTER TABLE [dbo].[kalite_kontrol_kalem] DROP CONSTRAINT [kalite_kontrol_kalem_fis_id_fkey];
ALTER TABLE [dbo].[kalite_kontrol_kalem] DROP CONSTRAINT [kalite_kontrol_kalem_malzeme_id_fkey];

-- AlterTable
-- 11-Fasondan Giriş kalemi: kalite kontrol gerekmez bayrağı.
ALTER TABLE [dbo].[irsaliye_kalem] ADD [kalite_yapilmayacak] BIT NOT NULL CONSTRAINT [irsaliye_kalem_kalite_yapilmayacak_df] DEFAULT 0;

-- AlterTable
-- KK kalemi: hangi irsaliye kaleminden (11) geldi? 1 irsaliye kalemi -> N KK kalemi.
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD [irsaliye_kalem_id] INT;

-- CreateIndex
CREATE INDEX [kalite_kontrol_kalem_irsaliye_kalem_id_idx] ON [dbo].[kalite_kontrol_kalem]([irsaliye_kalem_id]);

-- CreateIndex
-- Top barkodu tekilliği. SQL Server'da UNIQUE index NULL/'' değerlerini de tekrarlı sayar;
-- bu yüzden filtreli (filtered) index şart. Prisma şeması filtered index'i ifade edemez
-- (migration SQL'i ile eklenir, şemada @@index olarak temsil edilmez).
CREATE UNIQUE INDEX [kalite_kontrol_kalem_barkod_unique] ON [dbo].[kalite_kontrol_kalem]([barkod]) WHERE [barkod] IS NOT NULL AND [barkod] <> '';

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD CONSTRAINT [kalite_kontrol_kalem_fis_id_fkey] FOREIGN KEY ([fis_id]) REFERENCES [dbo].[kalite_kontrol]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD CONSTRAINT [kalite_kontrol_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
-- Bağlı 11 kalemi silinirse KK kaydı silinmez ama bağ kopar (ON DELETE NO ACTION:
-- silme engellenir, uygulama uyarı verir).
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD CONSTRAINT [kalite_kontrol_kalem_irsaliye_kalem_id_fkey] FOREIGN KEY ([irsaliye_kalem_id]) REFERENCES [dbo].[irsaliye_kalem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

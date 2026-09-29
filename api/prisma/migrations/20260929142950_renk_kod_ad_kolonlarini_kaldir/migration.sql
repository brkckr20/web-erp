/*
  Warnings:

  - You are about to drop the column `boyahane_renk_ad` on the `irsaliye_kalem` table. All the data in the column will be lost.
  - You are about to drop the column `boyahane_renk_kod` on the `irsaliye_kalem` table. All the data in the column will be lost.
  - You are about to drop the column `varyant1_renk_ad` on the `irsaliye_kalem` table. All the data in the column will be lost.
  - You are about to drop the column `varyant1_renk_kod` on the `irsaliye_kalem` table. All the data in the column will be lost.
  - You are about to drop the column `varyant2_renk_ad` on the `irsaliye_kalem` table. All the data in the column will be lost.
  - You are about to drop the column `varyant2_renk_kod` on the `irsaliye_kalem` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[irsaliye_kalem] DROP COLUMN [boyahane_renk_ad],
[boyahane_renk_kod],
[varyant1_renk_ad],
[varyant1_renk_kod],
[varyant2_renk_ad],
[varyant2_renk_kod];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

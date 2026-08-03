-- AlterTable
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [tip] NVARCHAR(20);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [takip_no] NVARCHAR(100);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [brut_agirlik] DECIMAL(18,6);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [net_agirlik] DECIMAL(18,6);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [brut_metre] DECIMAL(18,6);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [net_metre] DECIMAL(18,6);
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [adet] INT;
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD [olcu_birimi] NVARCHAR(20);

-- AlterTable
ALTER TABLE [dbo].[satis_irsaliye] ADD [fason_tipi_id] INT;

-- AddForeignKey
ALTER TABLE [dbo].[satis_irsaliye] ADD CONSTRAINT [satis_irsaliye_fason_tipi_id_fkey] FOREIGN KEY ([fason_tipi_id]) REFERENCES [dbo].[fason_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

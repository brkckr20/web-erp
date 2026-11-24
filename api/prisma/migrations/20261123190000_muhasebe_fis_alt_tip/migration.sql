ALTER TABLE [dbo].[muhasebe_entegrasyon_tanimi] ADD [fason_tipi_id] INT NULL;
ALTER TABLE [dbo].[muhasebe_fis] ADD [fason_tipi_id] INT NULL;

ALTER TABLE [dbo].[muhasebe_entegrasyon_tanimi]
  ADD CONSTRAINT [muhasebe_entegrasyon_tanimi_fason_tipi_id_fkey]
  FOREIGN KEY ([fason_tipi_id]) REFERENCES [dbo].[fason_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE [dbo].[muhasebe_fis]
  ADD CONSTRAINT [muhasebe_fis_fason_tipi_id_fkey]
  FOREIGN KEY ([fason_tipi_id]) REFERENCES [dbo].[fason_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX [muhasebe_entegrasyon_tanimi_fason_tipi_id_idx] ON [dbo].[muhasebe_entegrasyon_tanimi]([fason_tipi_id]);
CREATE INDEX [muhasebe_fis_fason_tipi_id_idx] ON [dbo].[muhasebe_fis]([fason_tipi_id]);

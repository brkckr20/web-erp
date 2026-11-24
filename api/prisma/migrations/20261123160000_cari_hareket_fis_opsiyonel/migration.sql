-- Fatura kaynaklı cari hareketler fisId taşımayabilir (belgeTuru=FATURA, belgeId=faturaId)
ALTER TABLE [dbo].[cari_hesap_hareket] ALTER COLUMN [fis_id] INT NULL;

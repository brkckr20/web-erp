-- Fason tipine kategori alanı (örn: "kumas;iplik;diger")
ALTER TABLE [dbo].[fason_tipi] ADD [kategoriler] VARCHAR(200);

-- Mevcut kayıtlar tüm kategorileri kapsasın (geriye dönük uyum)
UPDATE [dbo].[fason_tipi] SET [kategoriler] = 'kumas;iplik;diger' WHERE [kategoriler] IS NULL;

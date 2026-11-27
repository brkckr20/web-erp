-- 201-Satın Alma Siparişi onayı: onaylayan kullanıcı ve onay tarihi.
ALTER TABLE [irsaliye] ADD [onaylayan] VARCHAR(100);
ALTER TABLE [irsaliye] ADD [onay_tarihi] DATETIME2;

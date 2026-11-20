BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[rol] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(100) NOT NULL,
    [aciklama] VARCHAR(500),
    [aktif] BIT NOT NULL CONSTRAINT [rol_aktif_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [rol_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [rol_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [rol_ad_key] UNIQUE NONCLUSTERED ([ad])
);

-- CreateTable
CREATE TABLE [dbo].[izin] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(100) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    CONSTRAINT [izin_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [izin_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[rol_izin] (
    [rolId] INT NOT NULL,
    [izinId] INT NOT NULL,
    CONSTRAINT [rol_izin_pkey] PRIMARY KEY CLUSTERED ([rolId],[izinId])
);

-- CreateTable
CREATE TABLE [dbo].[kullanici_rol] (
    [kullaniciId] INT NOT NULL,
    [rolId] INT NOT NULL,
    CONSTRAINT [kullanici_rol_pkey] PRIMARY KEY CLUSTERED ([kullaniciId],[rolId])
);

-- AddForeignKey
ALTER TABLE [dbo].[rol_izin] ADD CONSTRAINT [rol_izin_rolId_fkey] FOREIGN KEY ([rolId]) REFERENCES [dbo].[rol]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[rol_izin] ADD CONSTRAINT [rol_izin_izinId_fkey] FOREIGN KEY ([izinId]) REFERENCES [dbo].[izin]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kullanici_rol] ADD CONSTRAINT [kullanici_rol_kullaniciId_fkey] FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[kullanici]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kullanici_rol] ADD CONSTRAINT [kullanici_rol_rolId_fkey] FOREIGN KEY ([rolId]) REFERENCES [dbo].[rol]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: izinler (8 modul x 4 islem)
INSERT INTO [dbo].[izin] ([kod], [ad])
SELECT v.kod, v.ad
FROM (VALUES
  ('stok.goruntule', N'Stok - Görüntüle'),
  ('stok.kaydet', N'Stok - Kaydet'),
  ('stok.sil', N'Stok - Sil'),
  ('stok.iptal', N'Stok - İptal'),
  ('siparis.goruntule', N'Sipariş - Görüntüle'),
  ('siparis.kaydet', N'Sipariş - Kaydet'),
  ('siparis.sil', N'Sipariş - Sil'),
  ('siparis.iptal', N'Sipariş - İptal'),
  ('uretim.goruntule', N'Üretim - Görüntüle'),
  ('uretim.kaydet', N'Üretim - Kaydet'),
  ('uretim.sil', N'Üretim - Sil'),
  ('uretim.iptal', N'Üretim - İptal'),
  ('satinalma.goruntule', N'Satın Alma - Görüntüle'),
  ('satinalma.kaydet', N'Satın Alma - Kaydet'),
  ('satinalma.sil', N'Satın Alma - Sil'),
  ('satinalma.iptal', N'Satın Alma - İptal'),
  ('satis.goruntule', N'Satış - Görüntüle'),
  ('satis.kaydet', N'Satış - Kaydet'),
  ('satis.sil', N'Satış - Sil'),
  ('satis.iptal', N'Satış - İptal'),
  ('muhasebe.goruntule', N'Muhasebe - Görüntüle'),
  ('muhasebe.kaydet', N'Muhasebe - Kaydet'),
  ('muhasebe.sil', N'Muhasebe - Sil'),
  ('muhasebe.iptal', N'Muhasebe - İptal'),
  ('hizmet-talep.goruntule', N'Hizmet Talep - Görüntüle'),
  ('hizmet-talep.kaydet', N'Hizmet Talep - Kaydet'),
  ('hizmet-talep.sil', N'Hizmet Talep - Sil'),
  ('hizmet-talep.iptal', N'Hizmet Talep - İptal'),
  ('ayarlar.goruntule', N'Ayarlar - Görüntüle'),
  ('ayarlar.kaydet', N'Ayarlar - Kaydet'),
  ('ayarlar.sil', N'Ayarlar - Sil'),
  ('ayarlar.iptal', N'Ayarlar - İptal')
) AS v(kod, ad)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[izin] i WHERE i.kod = v.kod);

-- Seed: başlangıç rolleri (dağıtım UI'dan değiştirilebilir)
INSERT INTO [dbo].[rol] ([ad], [aciklama], [aktif], [created_at], [updated_at])
SELECT v.ad, v.aciklama, 1, GETDATE(), GETDATE()
FROM (VALUES
  (N'Yönetici', N'Tüm izinler'),
  (N'Satış', N'Sipariş ve satış işlemleri'),
  (N'Satınalma', N'Satın alma işlemleri'),
  (N'Depo', N'Stok ve depo işlemleri'),
  (N'Üretim', N'Üretim işlemleri'),
  (N'Muhasebe', N'Muhasebe/finans işlemleri'),
  (N'Görüntüleme', N'Tüm modüllerde salt görüntüleme')
) AS v(ad, aciklama)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[rol] r WHERE r.ad = v.ad);

-- Seed: rol-izin eşlemesi
INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Yönetici'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Satış'
  AND (i.kod LIKE 'siparis.%' OR i.kod LIKE 'satis.%')
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Satınalma'
  AND i.kod LIKE 'satinalma.%'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Depo'
  AND i.kod LIKE 'stok.%'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Üretim'
  AND i.kod LIKE 'uretim.%'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Muhasebe'
  AND i.kod LIKE 'muhasebe.%'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

INSERT INTO [dbo].[rol_izin] ([rolId], [izinId])
SELECT r.id, i.id
FROM [dbo].[rol] r
CROSS JOIN [dbo].[izin] i
WHERE r.ad = N'Görüntüleme'
  AND i.kod LIKE '%.goruntule'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[rol_izin] x WHERE x.rolId = r.id AND x.izinId = i.id);

-- Geçiş: mevcut kullanıcılar geçici olarak Yönetici (dağıtım Faz 1/6'da UI'dan)
INSERT INTO [dbo].[kullanici_rol] ([kullaniciId], [rolId])
SELECT k.id, r.id
FROM [dbo].[kullanici] k
CROSS JOIN [dbo].[rol] r
WHERE r.ad = N'Yönetici'
  AND NOT EXISTS (SELECT 1 FROM [dbo].[kullanici_rol] x WHERE x.kullaniciId = k.id AND x.rolId = r.id);

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH

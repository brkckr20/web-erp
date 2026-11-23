CREATE TABLE [cari_hesap_fis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_tipi] VARCHAR(10) NOT NULL,
    [fis_no] INT NOT NULL,
    [fis_tarihi] DATETIME2 NOT NULL,
    [belge_no] VARCHAR(50),
    [k] VARCHAR(50),
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [doviz_cinsi] VARCHAR(10),
    [doviz_kuru] DECIMAL(18,6),
    [kur_tarihi] DATE,
    [masraf_yeri] VARCHAR(100),
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [cari_hesap_fis_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [cari_hesap_fis_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [cari_hesap_hareket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_id] INT NOT NULL,
    [cari_hesap_id] INT NOT NULL,
    [ozel_kod] VARCHAR(50),
    [hesap_kodu] VARCHAR(50),
    [hesap_adi] VARCHAR(200),
    [aciklama] VARCHAR(500),
    [vade_tarihi] DATE,
    [belge_no] VARCHAR(50),
    [borc] DECIMAL(18,2) NOT NULL CONSTRAINT [cari_hesap_hareket_borc_df] DEFAULT 0,
    [alacak] DECIMAL(18,2) NOT NULL CONSTRAINT [cari_hesap_hareket_alacak_df] DEFAULT 0,
    [doviz] VARCHAR(10),
    [doviz_kuru] DECIMAL(18,6),
    [borc_yerel] DECIMAL(18,2) NOT NULL CONSTRAINT [cari_hesap_hareket_borc_yerel_df] DEFAULT 0,
    [alacak_yerel] DECIMAL(18,2) NOT NULL CONSTRAINT [cari_hesap_hareket_alacak_yerel_df] DEFAULT 0,
    [belge_turu] VARCHAR(20),
    [belge_id] INT,
    [kontrol] VARCHAR(50),
    CONSTRAINT [cari_hesap_hareket_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cari_hesap_hareket_fis_id_fkey] FOREIGN KEY ([fis_id]) REFERENCES [cari_hesap_fis]([id]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [cari_hesap_hareket_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [cari_hesap]([id]) ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE UNIQUE INDEX [cari_hesap_fis_fis_tipi_fis_no_key] ON [cari_hesap_fis]([fis_tipi], [fis_no]);
CREATE INDEX [cari_hesap_fis_fis_tarihi_idx] ON [cari_hesap_fis]([fis_tarihi]);
CREATE INDEX [cari_hesap_hareket_fis_id_idx] ON [cari_hesap_hareket]([fis_id]);
CREATE INDEX [cari_hesap_hareket_cari_hesap_id_idx] ON [cari_hesap_hareket]([cari_hesap_id]);
CREATE INDEX [cari_hesap_hareket_vade_tarihi_idx] ON [cari_hesap_hareket]([vade_tarihi]);
CREATE INDEX [cari_hesap_hareket_belge_turu_belge_id_idx] ON [cari_hesap_hareket]([belge_turu], [belge_id]);

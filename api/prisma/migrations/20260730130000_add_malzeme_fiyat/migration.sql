CREATE TABLE [malzeme_fiyat] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [malzeme_id] INT NOT NULL,
    [tarih] DATE,
    [beden_id] INT,
    [doviz_cinsi] NVARCHAR(10),
    [fiyat] DECIMAL(18, 6),
    [created_at] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [malzeme_fiyat_pkey] PRIMARY KEY ([id])
);

CREATE INDEX [malzeme_fiyat_malzeme_id_idx] ON [malzeme_fiyat] ([malzeme_id]);

ALTER TABLE [malzeme_fiyat] ADD CONSTRAINT [malzeme_fiyat_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [malzeme]([id]) ON DELETE CASCADE;

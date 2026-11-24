CREATE TABLE [masraf_yeri] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [ozel_kod] VARCHAR(100),
    [erisim_kodu] VARCHAR(100),
    [aciklama] VARCHAR(1000),
    [doviz_cinsi] VARCHAR(10),
    [kullanimda] BIT NOT NULL CONSTRAINT [masraf_yeri_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [masraf_yeri_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [masraf_yeri_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE UNIQUE INDEX [masraf_yeri_kod_key] ON [masraf_yeri]([kod]);

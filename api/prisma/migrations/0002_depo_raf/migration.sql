-- CreateTable
CREATE TABLE [dbo].[depo_raf] (
    [id] INT NOT NULL IDENTITY(1,1),
    [depo_id] INT NOT NULL,
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kat] INT NULL CONSTRAINT [depo_raf_kat_df] DEFAULT 0,
    [raf_tipi] VARCHAR(50) NULL,
    [kapasite] DECIMAL(18,4) NULL,
    [kapasite_birimi] VARCHAR(20) NULL,
    [aktif] BIT NOT NULL CONSTRAINT [depo_raf_aktif_df] DEFAULT 1,
    [sira] INT NOT NULL CONSTRAINT [depo_raf_sira_df] DEFAULT 0,
    [aciklama] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [depo_raf_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [depo_raf_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [depo_raf_depo_id_kod_key] ON [dbo].[depo_raf]([depo_id], [kod]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [depo_raf_depo_id_idx] ON [dbo].[depo_raf]([depo_id]);

-- AddForeignKey
ALTER TABLE [dbo].[depo_raf] ADD CONSTRAINT [depo_raf_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

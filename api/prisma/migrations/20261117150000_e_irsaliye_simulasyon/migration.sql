-- e-İrsaliye simülasyonu: kullanıcı numaratörü (seri), XSLT tasarımları,
-- işlem geçmişi ve oluşturulan belgenin XML kopyası.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[kullanici_seri] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kullanici_id] INT NOT NULL,
    [belge_turu] VARCHAR(20) NOT NULL,
    [seri] VARCHAR(10) NOT NULL,
    [son_sira] INT NOT NULL CONSTRAINT [kullanici_seri_son_sira_df] DEFAULT 0,
    [son_yil] INT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [kullanici_seri_aktif_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kullanici_seri_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kullanici_seri_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [kullanici_seri_belge_turu_seri_key] ON [dbo].[kullanici_seri]([belge_turu], [seri]);
CREATE INDEX [kullanici_seri_kullanici_id_idx] ON [dbo].[kullanici_seri]([kullanici_id]);

-- AddForeignKey
ALTER TABLE [dbo].[kullanici_seri] ADD CONSTRAINT [kullanici_seri_kullanici_id_fkey] FOREIGN KEY ([kullanici_id]) REFERENCES [dbo].[kullanici]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE [dbo].[kullanici_tasarim] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kullanici_id] INT NOT NULL,
    [ad] NVARCHAR(100) NOT NULL,
    [xslt_dosya_adi] NVARCHAR(200) NOT NULL,
    [varsayilan] BIT NOT NULL CONSTRAINT [kullanici_tasarim_varsayilan_df] DEFAULT 0,
    [sira] INT NOT NULL CONSTRAINT [kullanici_tasarim_sira_df] DEFAULT 0,
    [aktif] BIT NOT NULL CONSTRAINT [kullanici_tasarim_aktif_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kullanici_tasarim_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kullanici_tasarim_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE INDEX [kullanici_tasarim_kullanici_id_idx] ON [dbo].[kullanici_tasarim]([kullanici_id]);

-- AddForeignKey
ALTER TABLE [dbo].[kullanici_tasarim] ADD CONSTRAINT [kullanici_tasarim_kullanici_id_fkey] FOREIGN KEY ([kullanici_id]) REFERENCES [dbo].[kullanici]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE [dbo].[e_irsaliye_log] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_id] INT NOT NULL,
    [islem] VARCHAR(30) NOT NULL,
    [durum] VARCHAR(30) NULL,
    [ettn_no] VARCHAR(50) NULL,
    [e_irsaliye_no] VARCHAR(50) NULL,
    [mesaj] NVARCHAR(1000) NULL,
    [kullanici_id] INT NULL,
    [kullanici_ad] NVARCHAR(200) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [e_irsaliye_log_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [e_irsaliye_log_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE INDEX [e_irsaliye_log_irsaliye_id_idx] ON [dbo].[e_irsaliye_log]([irsaliye_id]);

-- AddForeignKey
ALTER TABLE [dbo].[e_irsaliye_log] ADD CONSTRAINT [e_irsaliye_log_irsaliye_id_fkey] FOREIGN KEY ([irsaliye_id]) REFERENCES [dbo].[irsaliye]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable
ALTER TABLE [dbo].[irsaliye] ADD [e_irsaliye_xml] NVARCHAR(MAX) NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

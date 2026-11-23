BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[odeme_plan] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [aciklama] VARCHAR(1000),
    [kullanimda] BIT NOT NULL CONSTRAINT [odeme_plan_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [odeme_plan_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [odeme_plan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [odeme_plan_kod_key] UNIQUE NONCLUSTERED ([kod])
);

CREATE TABLE [dbo].[odeme_plan_satir] (
    [id] INT NOT NULL IDENTITY(1,1),
    [plan_id] INT NOT NULL,
    [sira] INT NOT NULL,
    [gun] INT NOT NULL,
    [oran] DECIMAL(5,2) NOT NULL,
    CONSTRAINT [odeme_plan_satir_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [odeme_plan_satir_plan_id_sira_key] UNIQUE NONCLUSTERED ([plan_id],[sira])
);

ALTER TABLE [dbo].[odeme_plan_satir] ADD CONSTRAINT [odeme_plan_satir_plan_id_fkey] FOREIGN KEY ([plan_id]) REFERENCES [dbo].[odeme_plan]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH

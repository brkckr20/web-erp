BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[fason_tipi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [fason_tipi_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fason_tipi_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [fason_tipi_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

CREATE TABLE [doviz] (
    [kod] NVARCHAR(10) NOT NULL,
    [alt_kod] NVARCHAR(50),
    [ad] NVARCHAR(200) NOT NULL,
    [sira] INT NOT NULL DEFAULT 0,
    [resim] NVARCHAR(500),
    [kullanimda] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [doviz_pkey] PRIMARY KEY ([kod])
);

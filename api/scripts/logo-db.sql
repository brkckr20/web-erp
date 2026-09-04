CREATE TABLE [dbo].[logo] (
    [id]          INT            IDENTITY(1,1) NOT NULL,
    [ad]          VARCHAR(100)  NOT NULL,
    [dosya_yolu]  VARCHAR(500)  NOT NULL,
    [mimetype]    VARCHAR(100)  NOT NULL,
    [boyut]       INT            NOT NULL,
    [created_at]  DATETIME       DEFAULT GETDATE() NOT NULL,
    CONSTRAINT [PK_logo] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_logo_ad] UNIQUE ([ad])
)

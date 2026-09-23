USE [School02]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID(N'dbo.Person', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Person](
        [person_id] [int] IDENTITY(1,1) NOT NULL,
        [first_name] [nvarchar](100) NOT NULL,
        [middle_name] [nvarchar](100) NULL,
        [last_name] [nvarchar](100) NOT NULL,
        [email] [nvarchar](150) NULL,
        [phone_number] [varchar](20) NULL,
        [created_at] [datetime2](0) NOT NULL
            CONSTRAINT [DF_Person_created_at] DEFAULT (sysutcdatetime()),
        CONSTRAINT [PK_Person] PRIMARY KEY CLUSTERED ([person_id] ASC),
        CONSTRAINT [UQ_Person_email] UNIQUE NONCLUSTERED ([email] ASC)
    ) ON [PRIMARY];
END
ELSE IF COL_LENGTH(N'dbo.Person', N'middle_name') IS NULL
BEGIN
    ALTER TABLE [dbo].[Person]
        ADD [middle_name] [nvarchar](100) NULL;
END
GO
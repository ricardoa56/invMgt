-- Run this once in each existing attendance tenant database.
IF COL_LENGTH('dbo.Person', 'middle_name') IS NULL
    ALTER TABLE dbo.Person ADD middle_name NVARCHAR(100) NULL;
GO

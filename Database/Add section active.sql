-- Run this once in each attendance tenant database.
IF COL_LENGTH('dbo.Sections', 'is_active') IS NULL
BEGIN
    ALTER TABLE dbo.Sections ADD is_active BIT NOT NULL CONSTRAINT DF_Sections_is_active DEFAULT (1);
END
GO
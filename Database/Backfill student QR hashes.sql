-- Run this once in each tenant database after qr_code_hash exists.
USE [School02]
GO

UPDATE dbo.Student
SET qr_code_hash = CONVERT(varchar(64), HASHBYTES('SHA2_256', tracking_code), 2)
WHERE qr_code_hash IS NULL
  AND tracking_code IS NOT NULL;
GO
-- Run this once in each attendance tenant database.
IF COL_LENGTH('dbo.Teacher', 'user_id') IS NULL
BEGIN
    ALTER TABLE dbo.Teacher ADD user_id INT NULL;
    CREATE UNIQUE INDEX UX_Teacher_user_id ON dbo.Teacher(user_id) WHERE user_id IS NOT NULL;
END
GO
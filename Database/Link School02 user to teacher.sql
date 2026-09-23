USE [School02]
GO

IF COL_LENGTH('dbo.Teacher', 'user_id') IS NULL
BEGIN
    ALTER TABLE dbo.Teacher ADD user_id INT NULL;
END
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Teacher_user_id'
      AND object_id = OBJECT_ID('dbo.Teacher')
)
BEGIN
    CREATE UNIQUE INDEX UX_Teacher_user_id
        ON dbo.Teacher(user_id)
        WHERE user_id IS NOT NULL;
END
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @UserId INT = 1;
DECLARE @EmployeeNumber NVARCHAR(50) = N'EMP-0001';
DECLARE @FirstName NVARCHAR(100) = N'School02';
DECLARE @MiddleName NVARCHAR(100) = NULL;
DECLARE @LastName NVARCHAR(100) = N'Administrator';
DECLARE @Email NVARCHAR(150);
DECLARE @PersonId INT;

-- The account user must exist in this tenant database.
SELECT @Email = Email
FROM dbo.Users
WHERE UserId = @UserId;

IF @Email IS NULL
    THROW 50001, 'The specified tenant user does not exist.', 1;

-- The Attendance API uses this role for teacher attendance scanning.
UPDATE dbo.Users
SET Role = N'Teacher'
WHERE UserId = @UserId;

IF EXISTS (SELECT 1 FROM dbo.Teacher WHERE user_id = @UserId)
BEGIN
    UPDATE dbo.Teacher
    SET employee_number = @EmployeeNumber
    WHERE user_id = @UserId;
END
ELSE
BEGIN
    SELECT @PersonId = person_id
    FROM dbo.Person
    WHERE email = @Email;

    IF @PersonId IS NULL
    BEGIN
        INSERT INTO dbo.Person (first_name, middle_name, last_name, email, phone_number)
        VALUES (@FirstName, @MiddleName, @LastName, @Email, NULL);
        SET @PersonId = CONVERT(INT, SCOPE_IDENTITY());
    END;

    INSERT INTO dbo.Teacher (user_id, person_id, employee_number)
    VALUES (@UserId, @PersonId, @EmployeeNumber);
END;

COMMIT TRANSACTION;

SELECT
    u.UserId,
    u.Username,
    u.Role,
    t.teacher_id,
    t.employee_number,
    t.person_id
FROM dbo.Users u
LEFT JOIN dbo.Teacher t ON t.user_id = u.UserId
WHERE u.UserId = @UserId;
GO

USE [InventoryDB]
GO

IF EXISTS
(
    SELECT 1
    FROM dbo.Accounts
    GROUP BY DatabaseName
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 50001, 'Accounts contains duplicate DatabaseName values. Resolve them before applying this script.', 1;
END
GO

IF COL_LENGTH('dbo.Accounts', 'ContactFirstName') IS NULL
    ALTER TABLE dbo.Accounts ADD ContactFirstName nvarchar(100) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'CompanyDescription') IS NULL
    ALTER TABLE dbo.Accounts ADD CompanyDescription nvarchar(500) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'ContactLastName') IS NULL
    ALTER TABLE dbo.Accounts ADD ContactLastName nvarchar(100) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'ContactEmail') IS NULL
    ALTER TABLE dbo.Accounts ADD ContactEmail nvarchar(256) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'ContactPhone') IS NULL
    ALTER TABLE dbo.Accounts ADD ContactPhone nvarchar(30) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'AddressLine1') IS NULL
    ALTER TABLE dbo.Accounts ADD AddressLine1 nvarchar(150) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'AddressLine2') IS NULL
    ALTER TABLE dbo.Accounts ADD AddressLine2 nvarchar(150) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'City') IS NULL
    ALTER TABLE dbo.Accounts ADD City nvarchar(100) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'StateProvince') IS NULL
    ALTER TABLE dbo.Accounts ADD StateProvince nvarchar(100) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'PostalCode') IS NULL
    ALTER TABLE dbo.Accounts ADD PostalCode nvarchar(20) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'Country') IS NULL
    ALTER TABLE dbo.Accounts ADD Country nvarchar(100) NULL;
GO

IF COL_LENGTH('dbo.Accounts', 'RegistrationStatus') IS NULL
BEGIN
    ALTER TABLE dbo.Accounts
        ADD RegistrationStatus nvarchar(30) NOT NULL
            CONSTRAINT DF_Accounts_RegistrationStatus DEFAULT ('Pending');
END
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'UQ_Accounts_DatabaseName'
      AND parent_object_id = OBJECT_ID('dbo.Accounts')
)
BEGIN
    ALTER TABLE dbo.Accounts
        ADD CONSTRAINT UQ_Accounts_DatabaseName UNIQUE (DatabaseName);
END
GO
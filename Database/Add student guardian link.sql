-- Existing attendance tenant databases should already contain Guardian and Student_Guardian.
-- Run the original student schema first if these tables do not exist.
IF OBJECT_ID(N'dbo.Student_Guardian', N'U') IS NULL
    THROW 50002, 'Student_Guardian does not exist. Apply the attendance schema first.', 1;
GO
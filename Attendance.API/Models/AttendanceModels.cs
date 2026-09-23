namespace Attendance.API.Models;

public sealed class AttendanceRecord
{
    public int AttendanceId { get; set; }
    public int StudentId { get; set; }
    public int SectionId { get; set; }
    public DateTime? CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public decimal? CheckInLatitude { get; set; }
    public decimal? CheckInLongitude { get; set; }
    public decimal? CheckInAccuracyMeters { get; set; }
    public decimal? CheckOutLatitude { get; set; }
    public decimal? CheckOutLongitude { get; set; }
    public decimal? CheckOutAccuracyMeters { get; set; }
    public string VerificationMethod { get; set; } = string.Empty;
    public int ScannedByTeacherId { get; set; }
    public int? CorrectedByTeacherId { get; set; }
    public DateTime? CorrectedAt { get; set; }
    public string? CorrectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Student
{
    public int StudentId { get; set; }
    public int PersonId { get; set; }
    public Person Person { get; set; } = null!;
    public int SectionId { get; set; }
    public string SchoolStudentNumber { get; set; } = string.Empty;
    public string TrackingCode { get; set; } = string.Empty;
    public string? QrCodeHash { get; set; }
}

public sealed class Section
{
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class Teacher
{
    public int TeacherId { get; set; }
    public int UserId { get; set; }
    public int PersonId { get; set; }
    public Person Person { get; set; } = null!;
    public string EmployeeNumber { get; set; } = string.Empty;
}

public sealed class Guardian
{
    public int GuardianId { get; set; }
    public int PersonId { get; set; }
    public Person Person { get; set; } = null!;
    public string? RelationshipType { get; set; }
    public string? ContactNumber { get; set; }
}

public sealed class StudentGuardian
{
    public int StudentId { get; set; }
    public int GuardianId { get; set; }
    public bool IsPrimaryContact { get; set; } = true;
}

public sealed class NotificationEvent
{
    public int EventId { get; set; }
    public int? SectionId { get; set; }
    public int CreatedByTeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? EventDate { get; set; }
}

public sealed class Person
{
    public int PersonId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
}
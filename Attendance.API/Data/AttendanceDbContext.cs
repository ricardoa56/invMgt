using Attendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Data;

public sealed class AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : DbContext(options)
{
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Person> Persons => Set<Person>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<NotificationEvent> NotificationEvents => Set<NotificationEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.ToTable("Attendance_Record");
            entity.HasKey(record => record.AttendanceId);
            entity.Property(record => record.AttendanceId).HasColumnName("attendance_id");
            entity.Property(record => record.StudentId).HasColumnName("student_id");
            entity.Property(record => record.SectionId).HasColumnName("section_id");
            entity.Property(record => record.CheckInAt).HasColumnName("check_in_at");
            entity.Property(record => record.CheckOutAt).HasColumnName("check_out_at");
            entity.Property(record => record.CheckInLatitude).HasColumnName("check_in_latitude");
            entity.Property(record => record.CheckInLongitude).HasColumnName("check_in_longitude");
            entity.Property(record => record.CheckInAccuracyMeters).HasColumnName("check_in_accuracy_meters");
            entity.Property(record => record.CheckOutLatitude).HasColumnName("check_out_latitude");
            entity.Property(record => record.CheckOutLongitude).HasColumnName("check_out_longitude");
            entity.Property(record => record.CheckOutAccuracyMeters).HasColumnName("check_out_accuracy_meters");
            entity.Property(record => record.VerificationMethod).HasColumnName("verification_method");
            entity.Property(record => record.ScannedByTeacherId).HasColumnName("scanned_by_teacher_id");
            entity.Property(record => record.CorrectedByTeacherId).HasColumnName("corrected_by_teacher_id");
            entity.Property(record => record.CorrectedAt).HasColumnName("corrected_at");
            entity.Property(record => record.CorrectionReason).HasColumnName("correction_reason");
            entity.Property(record => record.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("Student");
            entity.HasKey(student => student.StudentId);
            entity.Property(student => student.StudentId).HasColumnName("student_id");
            entity.Property(student => student.PersonId).HasColumnName("person_id");
            entity.Property(student => student.SectionId).HasColumnName("section_id");
            entity.Property(student => student.SchoolStudentNumber).HasColumnName("school_student_number");
            entity.Property(student => student.TrackingCode).HasColumnName("tracking_code");
            entity.Property(student => student.QrCodeHash).HasColumnName("qr_code_hash");
        });

        modelBuilder.Entity<Person>(entity =>
        {
            entity.ToTable("Person");
            entity.HasKey(person => person.PersonId);
            entity.Property(person => person.PersonId).HasColumnName("person_id");
            entity.Property(person => person.FirstName).HasColumnName("first_name");
            entity.Property(person => person.MiddleName).HasColumnName("middle_name");
            entity.Property(person => person.LastName).HasColumnName("last_name");
            entity.Property(person => person.Email).HasColumnName("email");
            entity.Property(person => person.PhoneNumber).HasColumnName("phone_number");
        });

        modelBuilder.Entity<Section>(entity =>
        {
            entity.ToTable("Sections");
            entity.HasKey(section => section.SectionId);
            entity.Property(section => section.SectionId).HasColumnName("section_id");
            entity.Property(section => section.SectionName).HasColumnName("section_name");
            entity.Property(section => section.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.ToTable("Teacher");
            entity.HasKey(teacher => teacher.TeacherId);
            entity.Property(teacher => teacher.TeacherId).HasColumnName("teacher_id");
            entity.Property(teacher => teacher.UserId).HasColumnName("user_id");
            entity.Property(teacher => teacher.PersonId).HasColumnName("person_id");
            entity.Property(teacher => teacher.EmployeeNumber).HasColumnName("employee_number");
        });

        modelBuilder.Entity<Guardian>(entity =>
        {
            entity.ToTable("Guardian");
            entity.HasKey(guardian => guardian.GuardianId);
            entity.Property(guardian => guardian.GuardianId).HasColumnName("guardian_id");
            entity.Property(guardian => guardian.PersonId).HasColumnName("person_id");
            entity.Property(guardian => guardian.RelationshipType).HasColumnName("relationship_type");
            entity.Property(guardian => guardian.ContactNumber).HasColumnName("contact_number");
        });

        modelBuilder.Entity<StudentGuardian>(entity =>
        {
            entity.ToTable("Student_Guardian");
            entity.HasKey(link => new { link.StudentId, link.GuardianId });
            entity.Property(link => link.StudentId).HasColumnName("student_id");
            entity.Property(link => link.GuardianId).HasColumnName("guardian_id");
            entity.Property(link => link.IsPrimaryContact).HasColumnName("is_primary_contact");
        });

        modelBuilder.Entity<NotificationEvent>(entity =>
        {
            entity.ToTable("Notification_Event");
            entity.HasKey(item => item.EventId);
            entity.Property(item => item.EventId).HasColumnName("event_id");
            entity.Property(item => item.SectionId).HasColumnName("section_id");
            entity.Property(item => item.CreatedByTeacherId).HasColumnName("created_by_teacher_id");
            entity.Property(item => item.Title).HasColumnName("title");
            entity.Property(item => item.Content).HasColumnName("content");
            entity.Property(item => item.EventDate).HasColumnName("event_date");
        });
    }
}
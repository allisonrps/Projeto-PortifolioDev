using Microsoft.EntityFrameworkCore;
using Aura.Domain.Entities;

namespace Aura.Infrastructure.Data;

public class AuraDbContext : DbContext
{
    public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options) { }

    public DbSet<Professor> Professors => Set<Professor>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Level> Levels => Set<Level>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<MonthlyPayment> MonthlyPayments => Set<MonthlyPayment>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<TemplateActivity> TemplateActivities => Set<TemplateActivity>();
    public DbSet<TemplateQuestion> TemplateQuestions => Set<TemplateQuestion>();
    public DbSet<StudentActivity> StudentActivities => Set<StudentActivity>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Define schema aura to isolate from public schema
        modelBuilder.HasDefaultSchema("aura");

        // Global query filter for soft delete
        modelBuilder.Entity<Professor>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Student>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Subject>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Level>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Lesson>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<MonthlyPayment>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Exam>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Exercise>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Schedule>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Holiday>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Subscription>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TemplateActivity>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TemplateQuestion>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<StudentActivity>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<StudentAnswer>().HasQueryFilter(e => !e.IsDeleted);

        // Professor
        modelBuilder.Entity<Professor>(e =>
        {
            e.HasIndex(p => p.Email).IsUnique();
            e.Property(p => p.Email).HasMaxLength(256).IsRequired();
            e.Property(p => p.PasswordHash).IsRequired();
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.Property(p => p.Theme).HasMaxLength(10).HasDefaultValue("dark");
            e.Property(p => p.PrimaryColor).HasMaxLength(20).HasDefaultValue("#7C3AED");
            e.Property(p => p.SecondaryColor).HasMaxLength(20).HasDefaultValue("#06B6D4");
            e.Property(p => p.PlanType).HasMaxLength(20).HasDefaultValue("free");
        });

        // Subject
        modelBuilder.Entity<Subject>(e =>
        {
            e.Property(s => s.Name).HasMaxLength(200).IsRequired();
            e.HasOne(s => s.Professor).WithMany(p => p.Subjects).HasForeignKey(s => s.ProfessorId).OnDelete(DeleteBehavior.Cascade);
        });

        // Level
        modelBuilder.Entity<Level>(e =>
        {
            e.Property(l => l.Name).HasMaxLength(200).IsRequired();
            e.HasOne(l => l.Subject).WithMany(s => s.Levels).HasForeignKey(l => l.SubjectId).OnDelete(DeleteBehavior.Cascade);
        });

        // Student
        modelBuilder.Entity<Student>(e =>
        {
            e.Property(s => s.Name).HasMaxLength(200).IsRequired();
            e.Property(s => s.Observation).HasMaxLength(1000);
            e.Property(s => s.Phone).HasMaxLength(30);
            e.Property(s => s.MonthlyPrice).HasPrecision(18, 2).HasDefaultValue(0m);
            e.Property(s => s.IsActive).HasDefaultValue(true);
            e.HasOne(s => s.Professor).WithMany(p => p.Students).HasForeignKey(s => s.ProfessorId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Subject).WithMany(s => s.Students).HasForeignKey(s => s.SubjectId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.Level).WithMany(l => l.Students).HasForeignKey(s => s.LevelId).OnDelete(DeleteBehavior.Restrict);
        });

        // Lesson
        modelBuilder.Entity<Lesson>(e =>
        {
            e.Property(l => l.Status).HasMaxLength(20).HasDefaultValue("scheduled");
            e.Property(l => l.Title).HasMaxLength(200);
            e.HasOne(l => l.Student).WithMany(s => s.Lessons).HasForeignKey(l => l.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(l => l.Professor).WithMany(p => p.Lessons).HasForeignKey(l => l.ProfessorId).OnDelete(DeleteBehavior.Restrict);
        });

        // MonthlyPayment
        modelBuilder.Entity<MonthlyPayment>(e =>
        {
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.HasOne(p => p.Student).WithMany(s => s.MonthlyPayments).HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        // Exam
        modelBuilder.Entity<Exam>(e =>
        {
            e.Property(ex => ex.Title).HasMaxLength(200).IsRequired();
            e.Property(ex => ex.Grade).HasPrecision(5, 2);
            e.Property(ex => ex.MaxGrade).HasPrecision(5, 2).HasDefaultValue(10m);
            e.HasOne(ex => ex.Student).WithMany(s => s.Exams).HasForeignKey(ex => ex.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        // Exercise
        modelBuilder.Entity<Exercise>(e =>
        {
            e.Property(ex => ex.Title).HasMaxLength(200).IsRequired();
            e.Property(ex => ex.Grade).HasPrecision(5, 2);
            e.Property(ex => ex.MaxGrade).HasPrecision(5, 2).HasDefaultValue(10m);
            e.HasOne(ex => ex.Student).WithMany(s => s.Exercises).HasForeignKey(ex => ex.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        // Schedule
        modelBuilder.Entity<Schedule>(e =>
        {
            e.HasOne(s => s.Professor).WithMany(p => p.Schedules).HasForeignKey(s => s.ProfessorId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Holiday
        modelBuilder.Entity<Holiday>(e =>
        {
            e.Property(h => h.Name).HasMaxLength(200).IsRequired();
            e.HasOne(h => h.Professor).WithMany(p => p.Holidays).HasForeignKey(h => h.ProfessorId).OnDelete(DeleteBehavior.Cascade);
        });

        // Subscription
        modelBuilder.Entity<Subscription>(e =>
        {
            e.Property(s => s.PlanType).HasMaxLength(20).IsRequired();
            e.Property(s => s.Price).HasPrecision(18, 2);
            e.Property(s => s.Status).HasMaxLength(20).HasDefaultValue("active");
            e.HasOne(s => s.Professor).WithMany(p => p.Subscriptions).HasForeignKey(s => s.ProfessorId).OnDelete(DeleteBehavior.Cascade);
        });

        // TemplateActivity
        modelBuilder.Entity<TemplateActivity>(e =>
        {
            e.Property(ta => ta.Title).HasMaxLength(200).IsRequired();
            e.Property(ta => ta.Type).HasMaxLength(20).HasDefaultValue("exercise");
            e.HasOne(ta => ta.Professor).WithMany().HasForeignKey(ta => ta.ProfessorId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ta => ta.Subject).WithMany().HasForeignKey(ta => ta.SubjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ta => ta.Level).WithMany().HasForeignKey(ta => ta.LevelId).OnDelete(DeleteBehavior.Cascade);
        });

        // TemplateQuestion
        modelBuilder.Entity<TemplateQuestion>(e =>
        {
            e.Property(q => q.QuestionText).IsRequired();
            e.Property(q => q.OptionA).IsRequired();
            e.Property(q => q.OptionB).IsRequired();
            e.Property(q => q.OptionC).IsRequired();
            e.Property(q => q.OptionD).IsRequired();
            e.Property(q => q.CorrectOption).IsRequired();
            e.HasOne(q => q.TemplateActivity).WithMany(ta => ta.Questions).HasForeignKey(q => q.TemplateActivityId).OnDelete(DeleteBehavior.Cascade);
        });

        // StudentActivity
        modelBuilder.Entity<StudentActivity>(e =>
        {
            e.Property(sa => sa.Status).HasMaxLength(20).HasDefaultValue("pending");
            e.Property(sa => sa.Grade).HasPrecision(5, 2);
            e.Property(sa => sa.MaxGrade).HasPrecision(5, 2).HasDefaultValue(10);
            e.HasOne(sa => sa.Student).WithMany().HasForeignKey(sa => sa.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(sa => sa.TemplateActivity).WithMany().HasForeignKey(sa => sa.TemplateActivityId).OnDelete(DeleteBehavior.Cascade);
        });

        // StudentAnswer
        modelBuilder.Entity<StudentAnswer>(e =>
        {
            e.Property(a => a.QuestionText).IsRequired();
            e.Property(a => a.OptionA).IsRequired();
            e.Property(a => a.OptionB).IsRequired();
            e.Property(a => a.OptionC).IsRequired();
            e.Property(a => a.OptionD).IsRequired();
            e.Property(a => a.CorrectOption).IsRequired();
            e.HasOne(a => a.StudentActivity).WithMany(sa => sa.Answers).HasForeignKey(a => a.StudentActivityId).OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}

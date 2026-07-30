using Aura.Application.DTOs.Students;

namespace Aura.Application.DTOs.Dashboard;

public class DashboardDto
{
    public int TotalStudents { get; set; }
    public int ActiveStudentsCount { get; set; }
    public int ArchivedStudentsCount { get; set; }
    public int MonthlyLessonsCount { get; set; }
    public int YearlyLessonsCount { get; set; }
    public double MonthlyWorkloadHours { get; set; }
    public double YearlyWorkloadHours { get; set; }
    public List<LessonResponseDto> TodayLessons { get; set; } = new();
    public LessonResponseDto? NextUpcomingLesson { get; set; }
    public List<BirthdayStudentDto> BirthdayStudents { get; set; } = new();
    public int AverageAttendanceRate { get; set; }
    public List<SubjectStatDto> SubjectStats { get; set; } = new();
    public List<LessonStatusStatDto> MonthlyLessonStatusStats { get; set; } = new();
    public List<LessonStatusStatDto> YearlyLessonStatusStats { get; set; } = new();
    public int MonthlyEffectivenessRate { get; set; } = 100;
    public int YearlyEffectivenessRate { get; set; } = 100;
}

public class LessonStatusStatDto
{
    public string Status { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Hours { get; set; }
    public double Percentage { get; set; }
}

public class BirthdayStudentDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int BirthDay { get; set; }
    public int Age { get; set; }
}

public class SubjectStatDto
{
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class FinanceDto
{
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal YearlyRevenue { get; set; }
    public List<MonthlyRevenueDto> RevenueProgression { get; set; } = new();
    public List<SubjectRevenueDto> RevenueBySubject { get; set; } = new();
    public List<StudentPaymentStatusDto> StudentPaymentStatuses { get; set; } = new();
}

public class MonthlyRevenueDto
{
    public string MonthName { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
}

public class SubjectRevenueDto
{
    public string SubjectName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class StudentPaymentStatusDto
{
    public Guid? PaymentId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string LevelName { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public bool IsPaid { get; set; }
    public decimal AmountPaid { get; set; }
}

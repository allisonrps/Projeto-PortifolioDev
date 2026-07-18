namespace Aura.Application.DTOs.Schedule;

public class ScheduleResponseDto
{
    public Guid Id { get; set; }
    public Guid ProfessorId { get; set; }
    public Guid StudentId { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsRecurring { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string? StudentName { get; set; }
}

public class CreateScheduleDto
{
    public Guid StudentId { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsRecurring { get; set; } = true;
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
}

public class UpdateScheduleDto
{
    public Guid? StudentId { get; set; }
    public int? DayOfWeek { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public bool? IsRecurring { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
}

public class ReplicateWeekDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class HolidayResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public bool IsVacationPeriod { get; set; }
    public DateTime? VacationStart { get; set; }
    public DateTime? VacationEnd { get; set; }
}

public class CreateHolidayDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public bool IsVacationPeriod { get; set; } = false;
    public DateTime? VacationStart { get; set; }
    public DateTime? VacationEnd { get; set; }
}

public class UpdateHolidayDto
{
    public string? Name { get; set; }
    public DateTime? Date { get; set; }
    public bool? IsVacationPeriod { get; set; }
    public DateTime? VacationStart { get; set; }
    public DateTime? VacationEnd { get; set; }
}

using AutoMapper;
using Aura.Domain.Entities;
using Aura.Application.DTOs.Auth;
using Aura.Application.DTOs.Students;
using Aura.Application.DTOs.Subjects;
using Aura.Application.DTOs.Dashboard;
using Aura.Application.DTOs.Schedule;

namespace Aura.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Professor
        CreateMap<Professor, ProfessorResponseDto>();

        // Student
        CreateMap<Student, StudentResponseDto>()
            .ForMember(d => d.SubjectName, o => o.MapFrom(s => s.Subject != null ? s.Subject.Name : null))
            .ForMember(d => d.LevelName, o => o.MapFrom(s => s.Level != null ? s.Level.Name : null))
            .ForMember(d => d.AttendanceRate, o => o.MapFrom(s => 
                s.Lessons != null && s.Lessons.Any(l => !l.IsDeleted && (l.Status == "completed" || l.Status == "cancelled"))
                ? (int)Math.Round((double)s.Lessons.Count(l => !l.IsDeleted && l.Status == "completed") / 
                                          s.Lessons.Count(l => !l.IsDeleted && (l.Status == "completed" || l.Status == "cancelled")) * 100)
                : 100
            ));
        CreateMap<Student, StudentDetailDto>()
            .ForMember(d => d.SubjectName, o => o.MapFrom(s => s.Subject != null ? s.Subject.Name : null))
            .ForMember(d => d.LevelName, o => o.MapFrom(s => s.Level != null ? s.Level.Name : null))
            .ForMember(d => d.Payments, o => o.MapFrom(s => s.MonthlyPayments))
            .ForMember(d => d.AttendanceRate, o => o.MapFrom(s => 
                s.Lessons != null && s.Lessons.Any(l => !l.IsDeleted && (l.Status == "completed" || l.Status == "cancelled"))
                ? (int)Math.Round((double)s.Lessons.Count(l => !l.IsDeleted && l.Status == "completed") / 
                                          s.Lessons.Count(l => !l.IsDeleted && (l.Status == "completed" || l.Status == "cancelled")) * 100)
                : 100
            ));
        CreateMap<CreateStudentDto, Student>();
        CreateMap<UpdateStudentDto, Student>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Subject
        CreateMap<Subject, SubjectResponseDto>()
            .ForMember(d => d.StudentCount, o => o.MapFrom(s => s.Students != null ? s.Students.Count : 0))
            .ForMember(d => d.Levels, o => o.MapFrom(s => s.Levels));
        CreateMap<CreateSubjectDto, Subject>();

        // Level
        CreateMap<Level, LevelResponseDto>()
            .ForMember(d => d.StudentCount, o => o.MapFrom(s => s.Students != null ? s.Students.Count : 0));
        CreateMap<CreateLevelDto, Level>();

        // Lesson
        CreateMap<Lesson, LessonResponseDto>()
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student != null ? s.Student.Name : null));
        CreateMap<CreateLessonDto, Lesson>();
        CreateMap<UpdateLessonDto, Lesson>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // MonthlyPayment
        CreateMap<MonthlyPayment, PaymentResponseDto>()
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student != null ? s.Student.Name : null));
        CreateMap<CreatePaymentDto, MonthlyPayment>();

        // Exam
        CreateMap<Exam, ExamResponseDto>()
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student != null ? s.Student.Name : null));
        CreateMap<CreateExamDto, Exam>();
        CreateMap<UpdateExamDto, Exam>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Exercise
        CreateMap<Exercise, ExerciseResponseDto>()
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student != null ? s.Student.Name : null));
        CreateMap<CreateExerciseDto, Exercise>();
        CreateMap<UpdateExerciseDto, Exercise>()
            .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

        // Schedule
        CreateMap<Schedule, ScheduleResponseDto>()
            .ForMember(d => d.StartTime, o => o.MapFrom(s => s.StartTime.ToString(@"hh\:mm")))
            .ForMember(d => d.EndTime, o => o.MapFrom(s => s.EndTime.ToString(@"hh\:mm")))
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student != null ? s.Student.Name : null));

        // Holiday
        CreateMap<Holiday, HolidayResponseDto>();
        CreateMap<CreateHolidayDto, Holiday>();

        // Dashboard
        CreateMap<Subject, SubjectStatDto>()
            .ForMember(d => d.SubjectId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.SubjectName, o => o.MapFrom(s => s.Name))
            .ForMember(d => d.StudentCount, o => o.MapFrom(s => s.Students != null ? s.Students.Count : 0));
    }
}

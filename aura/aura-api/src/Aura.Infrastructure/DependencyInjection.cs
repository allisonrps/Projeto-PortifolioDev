using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Aura.Application.Mappings;
using Aura.Application.Services;
using Aura.Domain.Interfaces;
using Aura.Infrastructure.Data;
using Aura.Infrastructure.Repositories;
using Aura.Infrastructure.Services;

namespace Aura.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AuraDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        services.AddScoped<IProfessorRepository, ProfessorRepository>();
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<ILevelRepository, LevelRepository>();
        services.AddScoped<ILessonRepository, LessonRepository>();
        services.AddScoped<IMonthlyPaymentRepository, MonthlyPaymentRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExerciseRepository, ExerciseRepository>();
        services.AddScoped<IScheduleRepository, ScheduleRepository>();
        services.AddScoped<IHolidayRepository, HolidayRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<ISubjectService, SubjectService>();
        services.AddScoped<ILevelService, LevelService>();
        services.AddScoped<ILessonService, LessonService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IExerciseService, ExerciseService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<IHolidayService, HolidayService>();
        services.AddScoped<IFinanceService, FinanceService>();

        // AutoMapper
        services.AddAutoMapper(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });

        return services;
    }
}

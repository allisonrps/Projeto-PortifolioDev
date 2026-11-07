using System.Text;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Aura.API.Middleware;
using Aura.Application.Services;
using Aura.Infrastructure;
using Aura.Infrastructure.Services;

// Fix: PostgreSQL requires UTC DateTimes - enable legacy behavior
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Carregar cofre local de chaves (ignorado pelo Git)
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

// Add Infrastructure (DB, Repos, Services, AutoMapper)
builder.Services.AddInfrastructure(builder.Configuration);

// File Storage Service
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(wwwrootPath);
builder.Services.AddSingleton<IFileStorageService>(new FileStorageService(wwwrootPath));

// JWT Authentication (prioriza variável de ambiente JWT_SECRET_KEY)
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
             ?? builder.Configuration["JwtSettings:Key"]
             ?? throw new InvalidOperationException("Chave JWT não configurada.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.FromMinutes(2),
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// Rate Limiting (Proteção OWASP A07 / API4 contra Brute Force e abuso de endpoints públicos)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Política estrita para Login, Registro e Troca de Senha: 15 requisições por minuto por IP
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Política para rotas públicas de alunos/fichas/provas: 60 requisições por minuto por IP
    options.AddPolicy("public", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// CORS restrito a origens confiáveis
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        var trustedSet = new HashSet<string>(configuredOrigins, StringComparer.OrdinalIgnoreCase)
        {
            "https://aura-teacher.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        };

        policy.SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrWhiteSpace(origin)) return false;
                  if (trustedSet.Contains(origin)) return true;
                  if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return true;
                      if (uri.Scheme == "https" &&
                          uri.Host.StartsWith("aura-teacher", StringComparison.OrdinalIgnoreCase) &&
                          uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }
                  }
                  return false;
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-migrate database and ensure performance indexes on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<Aura.Infrastructure.Data.AuraDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migrate warning: {ex.Message}");
    }

    try
    {
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS aura.""ManualFinanceEntries"" (
                ""Id"" uuid NOT NULL,
                ""ProfessorId"" uuid NOT NULL,
                ""Amount"" numeric(18,2) NOT NULL,
                ""Date"" timestamp without time zone NOT NULL,
                ""Month"" integer NOT NULL,
                ""Year"" integer NOT NULL,
                ""Description"" character varying(500) NOT NULL,
                ""CreatedAt"" timestamp without time zone NOT NULL,
                ""UpdatedAt"" timestamp without time zone NULL,
                ""IsDeleted"" boolean NOT NULL,
                CONSTRAINT ""PK_ManualFinanceEntries"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_ManualFinanceEntries_Professors_ProfessorId"" FOREIGN KEY (""ProfessorId"") REFERENCES aura.""Professors"" (""Id"") ON DELETE CASCADE
            );

            -- Colunas de Assinatura e Período de Teste (Trial)
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""CpfCnpj"" character varying(25) NULL;
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""SubscriptionStatus"" character varying(20) NOT NULL DEFAULT 'trial';
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""TrialEndsAt"" timestamp without time zone NULL;
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""SubscriptionExpiresAt"" timestamp without time zone NULL;
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""AsaasCustomerId"" character varying(100) NULL;
            ALTER TABLE aura.""Professors"" ADD COLUMN IF NOT EXISTS ""IsAdmin"" boolean NOT NULL DEFAULT false;

            UPDATE aura.""Professors""
               SET ""TrialEndsAt"" = NOW() + INTERVAL '14 days',
                   ""SubscriptionStatus"" = 'trial',
                   ""PlanType"" = 'trial'
             WHERE ""TrialEndsAt"" IS NULL AND ""SubscriptionExpiresAt"" IS NULL;

            -- Licença anual pré-ativada para fernandasanaiotinogueira@gmail.com
            UPDATE aura.""Professors""
               SET ""PlanType"" = 'annual',
                   ""SubscriptionStatus"" = 'active',
                   ""SubscriptionExpiresAt"" = GREATEST(COALESCE(""SubscriptionExpiresAt"", NOW()), NOW() + INTERVAL '365 days')
             WHERE LOWER(""Email"") = 'fernandasanaiotinogueira@gmail.com';

            -- Garantir permissão de Administrador exclusivamente para allison_rps@hotmail.com
            UPDATE aura.""Professors""
               SET ""IsAdmin"" = (LOWER(""Email"") = 'allison_rps@hotmail.com');

            ALTER TABLE aura.""Subscriptions"" ADD COLUMN IF NOT EXISTS ""BillingType"" character varying(30) NOT NULL DEFAULT 'UNDEFINED';
            ALTER TABLE aura.""Subscriptions"" ADD COLUMN IF NOT EXISTS ""InvoiceUrl"" character varying(500) NULL;
            ALTER TABLE aura.""Subscriptions"" ADD COLUMN IF NOT EXISTS ""PixQrCodeImage"" text NULL;
            ALTER TABLE aura.""Subscriptions"" ADD COLUMN IF NOT EXISTS ""PixCopyPaste"" text NULL;
            CREATE INDEX IF NOT EXISTS ""IX_Subscriptions_PaymentGatewayId"" ON aura.""Subscriptions"" (""PaymentGatewayId"");

            CREATE TABLE IF NOT EXISTS aura.""PlatformSettings"" (
                ""Key"" character varying(100) NOT NULL PRIMARY KEY,
                ""Value"" text NOT NULL,
                ""UpdatedAt"" timestamp without time zone NOT NULL
            );

            ALTER TABLE aura.""Schedules"" ADD COLUMN IF NOT EXISTS ""Frequency"" character varying(20) NOT NULL DEFAULT 'weekly';

            ALTER TABLE aura.""Students"" ADD COLUMN IF NOT EXISTS ""City"" character varying(120) NULL;
            ALTER TABLE aura.""Students"" ADD COLUMN IF NOT EXISTS ""State"" character varying(60) NULL;
            ALTER TABLE aura.""Students"" ADD COLUMN IF NOT EXISTS ""Country"" character varying(120) NULL;

            -- Limpar aulas futuras de alunos arquivados (após a data da última aula)
            UPDATE aura.""Lessons"" l
               SET ""IsDeleted"" = true,
                   ""UpdatedAt"" = NOW()
              FROM aura.""Students"" s
             WHERE l.""StudentId"" = s.""Id""
               AND l.""IsDeleted"" = false
               AND (
                   (s.""LastClassDate"" IS NOT NULL AND l.""ScheduledAt""::date > s.""LastClassDate""::date)
                   OR (s.""IsActive"" = false AND s.""LastClassDate"" IS NULL AND l.""Status"" = 'scheduled' AND l.""ScheduledAt""::date > CURRENT_DATE)
               );

            -- Encerrar vigência de horários recorrentes de alunos arquivados na data da última aula
            UPDATE aura.""Schedules"" sch
               SET ""ValidUntil"" = COALESCE(s.""LastClassDate""::date, CURRENT_DATE),
                   ""UpdatedAt"" = NOW()
              FROM aura.""Students"" s
             WHERE sch.""StudentId"" = s.""Id""
               AND sch.""IsDeleted"" = false
               AND s.""IsActive"" = false
               AND (sch.""ValidUntil"" IS NULL OR sch.""ValidUntil""::date > COALESCE(s.""LastClassDate""::date, CURRENT_DATE));

            -- Índices compostos de alta performance para consultas frequentes (Dashboard, Agenda, Finanças, Alunos e Portal)
            CREATE INDEX IF NOT EXISTS ""IX_Students_ProfessorId_IsDeleted_IsActive"" ON aura.""Students"" (""ProfessorId"", ""IsDeleted"", ""IsActive"");
            CREATE INDEX IF NOT EXISTS ""IX_Lessons_ProfessorId_IsDeleted_ScheduledAt_Status"" ON aura.""Lessons"" (""ProfessorId"", ""IsDeleted"", ""ScheduledAt"", ""Status"");
            CREATE INDEX IF NOT EXISTS ""IX_Lessons_StudentId_IsDeleted_ScheduledAt"" ON aura.""Lessons"" (""StudentId"", ""IsDeleted"", ""ScheduledAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_MonthlyPayments_StudentId_IsDeleted_Year_Month_IsPaid"" ON aura.""MonthlyPayments"" (""StudentId"", ""IsDeleted"", ""Year"", ""Month"", ""IsPaid"");
            CREATE INDEX IF NOT EXISTS ""IX_ManualFinanceEntries_ProfessorId_IsDeleted_Year_Month"" ON aura.""ManualFinanceEntries"" (""ProfessorId"", ""IsDeleted"", ""Year"", ""Month"");
            CREATE INDEX IF NOT EXISTS ""IX_StudentActivities_StudentId_IsDeleted_Status_ScheduledAt"" ON aura.""StudentActivities"" (""StudentId"", ""IsDeleted"", ""Status"", ""ScheduledAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_StudentActivities_Status_IsDeleted_CompletedAt"" ON aura.""StudentActivities"" (""Status"", ""IsDeleted"", ""CompletedAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_StudentAnswers_StudentActivityId_IsDeleted"" ON aura.""StudentAnswers"" (""StudentActivityId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_TemplateActivities_ProfessorId_IsDeleted_CreatedAt"" ON aura.""TemplateActivities"" (""ProfessorId"", ""IsDeleted"", ""CreatedAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_TemplateQuestions_TemplateActivityId_IsDeleted"" ON aura.""TemplateQuestions"" (""TemplateActivityId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_Schedules_ProfessorId_IsDeleted_DayOfWeek_IsRecurring"" ON aura.""Schedules"" (""ProfessorId"", ""IsDeleted"", ""DayOfWeek"", ""IsRecurring"");
            CREATE INDEX IF NOT EXISTS ""IX_Schedules_StudentId_IsDeleted"" ON aura.""Schedules"" (""StudentId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_Holidays_ProfessorId_IsDeleted_Date"" ON aura.""Holidays"" (""ProfessorId"", ""IsDeleted"", ""Date"");
            CREATE INDEX IF NOT EXISTS ""IX_Exams_StudentId_IsDeleted_ScheduledAt"" ON aura.""Exams"" (""StudentId"", ""IsDeleted"", ""ScheduledAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_Exercises_StudentId_IsDeleted_ScheduledAt"" ON aura.""Exercises"" (""StudentId"", ""IsDeleted"", ""ScheduledAt"" DESC);
            CREATE INDEX IF NOT EXISTS ""IX_Subjects_ProfessorId_IsDeleted"" ON aura.""Subjects"" (""ProfessorId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_Levels_SubjectId_IsDeleted"" ON aura.""Levels"" (""SubjectId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_ClassSheets_LevelId_IsDeleted"" ON aura.""ClassSheets"" (""LevelId"", ""IsDeleted"");
            CREATE INDEX IF NOT EXISTS ""IX_ClassSheetStudents_ClassSheetId"" ON aura.""ClassSheetStudents"" (""ClassSheetId"");
        ");

        // Garantir que a conta exclusiva do desenvolvedor (allison_rps@hotmail.com) exista e esteja ativa
        var devEmail = "allison_rps@hotmail.com";
        var devAdmin = db.Professors.FirstOrDefault(p => p.Email.ToLower() == devEmail);
        if (devAdmin == null)
        {
            devAdmin = new Aura.Domain.Entities.Professor
            {
                Name = "Allison Rodrigues",
                Email = devEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("AuraAdmin@2026"),
                IsAdmin = true,
                PlanType = "lifetime",
                SubscriptionStatus = "active",
                TrialEndsAt = DateTime.UtcNow.AddDays(14),
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(50)
            };
            db.Professors.Add(devAdmin);
            db.SaveChanges();

            var defaultSubject = new Aura.Domain.Entities.Subject { ProfessorId = devAdmin.Id, Name = "Geral" };
            db.Subjects.Add(defaultSubject);
            db.SaveChanges();

            db.Levels.Add(new Aura.Domain.Entities.Level { SubjectId = defaultSubject.Id, Name = "Geral" });
            db.SaveChanges();
        }
        else if (devAdmin.PlanType != "lifetime" || !devAdmin.IsAdmin)
        {
            devAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("AuraAdmin@2026");
            devAdmin.IsAdmin = true;
            devAdmin.PlanType = "lifetime";
            devAdmin.SubscriptionStatus = "active";
            devAdmin.SubscriptionExpiresAt = DateTime.UtcNow.AddYears(50);
            db.SaveChanges();
        }

        // Sincronizar chave do gateway Asaas para o cofre do banco se presente no ambiente ou appsettings.Secrets.json
        var startupAsaasKey = Environment.GetEnvironmentVariable("ASAAS_API_KEY")
                              ?? builder.Configuration["Asaas:ApiKey"];
        if (!string.IsNullOrWhiteSpace(startupAsaasKey))
        {
            var trimmedKey = startupAsaasKey.Trim();
            var existingSetting = db.PlatformSettings.FirstOrDefault(s => s.Key == "ASAAS_API_KEY");
            if (existingSetting == null)
            {
                db.PlatformSettings.Add(new Aura.Domain.Entities.PlatformSetting
                {
                    Key = "ASAAS_API_KEY",
                    Value = trimmedKey,
                    UpdatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
            }
            else if (existingSetting.Value != trimmedKey)
            {
                existingSetting.Value = trimmedKey;
                existingSetting.UpdatedAt = DateTime.UtcNow;
                db.SaveChanges();
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Ensure tables and indexes warning: {ex.Message}");
    }
}

// Security Headers Middleware (OWASP A05)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.Urls.Add("http://localhost:5000");
}

app.UseStaticFiles();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SubscriptionWriteGuardMiddleware>();
app.MapControllers();

app.Run();

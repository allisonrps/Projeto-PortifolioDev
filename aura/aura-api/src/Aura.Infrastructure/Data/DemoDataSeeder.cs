using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aura.Domain.Entities;

namespace Aura.Infrastructure.Data;

public static class DemoDataSeeder
{
    private class StudentSeedItem
    {
        public string Name { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime Birth { get; set; }
        public DateTime FirstClass { get; set; }
        public string? GuardianName { get; set; }
        public string? GuardianPhone { get; set; }
        public string Obs { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty;
        public int DayOfWeek { get; set; } // 1 = Seg ... 6 = Sab
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    private static DateTime GetRecentDateForDayOfWeek(int targetDayOfWeek, int weeksAgo, TimeSpan time)
    {
        var date = DateTime.UtcNow.Date;
        int currentDayOfWeek = (int)date.DayOfWeek;
        int diff = targetDayOfWeek - currentDayOfWeek;
        if (diff > 0)
        {
            diff -= 7;
        }
        var baseDate = date.AddDays(diff).AddDays(-7 * weeksAgo);
        return DateTime.SpecifyKind(baseDate.Add(time), DateTimeKind.Utc);
    }

    private static DateTime GetFutureDateForDayOfWeek(int targetDayOfWeek, int weeksAhead, TimeSpan time)
    {
        var date = DateTime.UtcNow.Date;
        int currentDayOfWeek = (int)date.DayOfWeek;
        int diff = targetDayOfWeek - currentDayOfWeek;
        if (diff <= 0)
        {
            diff += 7;
        }
        var baseDate = date.AddDays(diff).AddDays(7 * (weeksAhead - 1));
        return DateTime.SpecifyKind(baseDate.Add(time), DateTimeKind.Utc);
    }

    public static async Task SeedAllisonAccountAsync(AuraDbContext db, bool force = false)
    {
        var devEmail = "allison_rps@hotmail.com";
        var professor = await db.Professors.FirstOrDefaultAsync(p => p.Email.ToLower() == devEmail);
        if (professor == null)
        {
            professor = new Professor
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
            db.Professors.Add(professor);
            await db.SaveChangesAsync();
        }

        var now = DateTime.UtcNow;

        // 1. Matérias e Níveis (3 Matérias coerentes para um professor de Idiomas e Business)
        var subjectDefs = new[]
        {
            new
            {
                Name = "Inglês Geral & Conversação",
                Levels = new[] { "Iniciante (A1-A2)", "Intermediário (B1-B2)", "Avançado & Fluência (C1)" }
            },
            new
            {
                Name = "Inglês para Negócios & Carreiras",
                Levels = new[] { "Business Essentials", "Corporate Leadership" }
            },
            new
            {
                Name = "Preparatório IELTS & TOEFL",
                Levels = new[] { "Academic IELTS Focus", "Exam Strategies & Speaking" }
            }
        };

        var levelMap = new Dictionary<string, Level>();

        foreach (var sDef in subjectDefs)
        {
            var subject = await db.Subjects
                .Include(s => s.Levels)
                .FirstOrDefaultAsync(s => s.ProfessorId == professor.Id && s.Name == sDef.Name && !s.IsDeleted);

            if (subject == null)
            {
                subject = new Subject
                {
                    ProfessorId = professor.Id,
                    Name = sDef.Name,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                db.Subjects.Add(subject);
                await db.SaveChangesAsync();
            }

            foreach (var lvlName in sDef.Levels)
            {
                var lvl = await db.Levels
                    .FirstOrDefaultAsync(l => l.SubjectId == subject.Id && l.Name == lvlName && !l.IsDeleted);

                if (lvl == null)
                {
                    lvl = new Level
                    {
                        SubjectId = subject.Id,
                        Name = lvlName,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.Levels.Add(lvl);
                    await db.SaveChangesAsync();
                }

                levelMap[lvlName] = lvl;
            }
        }

        // 2. Fichas Pedagógicas Ricas
        var sheetDefs = new[]
        {
            new
            {
                LevelName = "Intermediário (B1-B2)",
                Title = "⭐ Prepositions of Time & Place: In, On, At",
                Content = @"<div><strong style=""color: #8b5cf6; font-size: 18px;"">⭐ Preposições Essenciais em Inglês</strong></div>
<div><br></div>
<div><strong>1. Prepositions of Time (Tempo):</strong></div>
<div>• <strong>IN</strong>: Meses, anos, estações e períodos do dia.</div>
<div>&nbsp;&nbsp;<em>Ex: in July, in 2026, in the morning, in winter.</em></div>
<div>• <strong>ON</strong>: Dias da semana e datas específicas.</div>
<div>&nbsp;&nbsp;<em>Ex: on Monday, on my birthday, on November 15th.</em></div>
<div>• <strong>AT</strong>: Horários exatos e momentos precisos.</div>
<div>&nbsp;&nbsp;<em>Ex: at 7 o'clock, at noon, at midnight, at night.</em></div>
<div><br></div>
<div><strong>2. Prepositions of Place (Lugar):</strong></div>
<div>• <strong>IN</strong>: Dentro de um espaço fechado ou área geográfica.</div>
<div>&nbsp;&nbsp;<em>Ex: in the room, in São Paulo, in Brazil.</em></div>
<div>• <strong>ON</strong>: Em cima de uma superfície.</div>
<div>&nbsp;&nbsp;<em>Ex: on the table, on the wall, on the 5th floor.</em></div>
<div>• <strong>AT</strong>: Ponto de encontro ou local específico de atividade.</div>
<div>&nbsp;&nbsp;<em>Ex: at school, at the bus stop, at the entrance.</em></div>"
            },
            new
            {
                LevelName = "Avançado & Fluência (C1)",
                Title = "🚀 Essential Phrasal Verbs for Daily Fluency",
                Content = @"<div><strong style=""color: #06b6d4; font-size: 18px;"">🚀 Phrasal Verbs de Alto Impacto para Fluência</strong></div>
<div><br></div>
<div><strong>1. Comunicação e Tomada de Decisão:</strong></div>
<div>• <strong>Figure out</strong>: Encontrar uma solução ou entender algo complexo.</div>
<div>&nbsp;&nbsp;<em>Ex: We need to figure out why the client wasn't satisfied.</em></div>
<div>• <strong>Bring up</strong>: Mencionar um assunto ou pauta em uma conversa.</div>
<div>&nbsp;&nbsp;<em>Ex: She brought up an interesting point during the meeting.</em></div>
<div>• <strong>Turn out</strong>: Resultar de forma inesperada ou positiva.</div>
<div>&nbsp;&nbsp;<em>Ex: The presentation turned out to be a great success!</em></div>
<div><br></div>
<div><strong>2. Produtividade & Ação:</strong></div>
<div>• <strong>Carry out</strong>: Executar um plano ou tarefa prática.</div>
<div>• <strong>Follow up</strong>: Fazer o acompanhamento de uma solicitação ou email.</div>"
            },
            new
            {
                LevelName = "Business Essentials",
                Title = "💼 Professional Email Etiquette & Corporate Phrasing",
                Content = @"<div><strong style=""color: #10b981; font-size: 18px;"">💼 Como Escrever E-mails Corporativos em Inglês</strong></div>
<div><br></div>
<div><strong>Aberturas Profissionais:</strong></div>
<div>• <em>Dear Mr./Ms. [Sobrenome],</em> (Formal)</div>
<div>• <em>Good morning, [Nome],</em> (Profissional Moderno)</div>
<div>• <em>I hope this email finds you well.</em> (Cortesia padrão executiva)</div>
<div><br></div>
<div><strong>Compartilhando Documentos e Atualizações:</strong></div>
<div>• <em>Please find attached the updated report for Q4.</em></div>
<div>• <em>As discussed in yesterday's call, here are the next steps.</em></div>
<div><br></div>
<div><strong>Encerramentos Executivos:</strong></div>
<div>• <em>Best regards,</em></div>
<div>• <em>Looking forward to hearing from you.</em></div>"
            },
            new
            {
                LevelName = "Corporate Leadership",
                Title = "🎯 Executive Presentations: Pitching Ideas with Impact",
                Content = @"<div><strong style=""color: #f59e0b; font-size: 18px;"">🎯 Estrutura de Pitch Executivo em Inglês</strong></div>
<div><br></div>
<div><strong>1. The Hook (O Gancho):</strong></div>
<div>• <em>""Did you know that 70% of remote teams struggle with alignment?""</em></div>
<div><br></div>
<div><strong>2. The Problem & Solution:</strong></div>
<div>• <em>""Our current workflow takes 12 hours weekly. By implementing this tool, we reduce it to 3.""</em></div>
<div><br></div>
<div><strong>3. Call to Action (Chamada para Ação):</strong></div>
<div>• <em>""I recommend we approve the pilot program by next Friday to start onboarding.""</em></div>"
            },
            new
            {
                LevelName = "Academic IELTS Focus",
                Title = "💡 IELTS Speaking Part 2: Structure & High-Scoring Idioms",
                Content = @"<div><strong style=""color: #ec4899; font-size: 18px;"">💡 Dominando o IELTS Speaking Part 2 (Band 8.0+)</strong></div>
<div><br></div>
<div><strong>Estrutura de 2 Minutos:</strong></div>
<div>1. <strong>Introduction</strong>: Introduzir o tópico com paráfrase (15 seg).</div>
<div>2. <strong>Key Details</strong>: Descrever quem, quando e onde (45 seg).</div>
<div>3. <strong>Core Story</strong>: Contar o evento principal e sentimentos (45 seg).</div>
<div>4. <strong>Reflection</strong>: Conclusão e lição aprendida (15 seg).</div>
<div><br></div>
<div><strong>Expressões Idiomáticas Recomendadas:</strong></div>
<div>• <em>""Once in a blue moon""</em> (Muito raramente)</div>
<div>• <em>""Over the moon""</em> (Extremamente feliz)</div>
<div>• <em>""Down in the dumps""</em> (Desanimado)</div>"
            }
        };

        var createdSheets = new List<ClassSheet>();
        foreach (var sDef in sheetDefs)
        {
            if (!levelMap.TryGetValue(sDef.LevelName, out var lvl)) continue;

            var sheet = await db.ClassSheets
                .FirstOrDefaultAsync(cs => cs.LevelId == lvl.Id && cs.Title == sDef.Title && !cs.IsDeleted);

            if (sheet == null)
            {
                sheet = new ClassSheet
                {
                    LevelId = lvl.Id,
                    Title = sDef.Title,
                    Content = sDef.Content,
                    CreatedAt = now.AddDays(-30),
                    UpdatedAt = now.AddDays(-5)
                };
                db.ClassSheets.Add(sheet);
                await db.SaveChangesAsync();
            }
            createdSheets.Add(sheet);
        }

        // 3. 15 Alunos Fakes com Fotos Nítidas e Horários Distribuídos de Segunda a Sábado
        var studentDefs = new List<StudentSeedItem>
        {
            // Segunda-feira (3 alunos)
            new StudentSeedItem {
                Name = "Ana Cecília Hendrie de Oliveira",
                Level = "Intermediário (B1-B2)",
                Price = 380m,
                City = "São Paulo", State = "SP", Phone = "(11) 98765-4321",
                Birth = now.AddYears(-22).AddDays(-40),
                FirstClass = now.AddMonths(-14),
                GuardianName = null, GuardianPhone = null,
                Obs = "Foco em viagens e conversação para intercâmbio.",
                PhotoUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 1, StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(10, 0, 0)
            },
            new StudentSeedItem {
                Name = "Gabriel Medeiros Vasconcelos",
                Level = "Avançado & Fluência (C1)",
                Price = 420m,
                City = "Campinas", State = "SP", Phone = "(19) 99123-4567",
                Birth = now.AddYears(-27).AddDays(-120),
                FirstClass = now.AddMonths(-18),
                GuardianName = null, GuardianPhone = null,
                Obs = "Engenheiro de software. Foco em reuniões com time dos EUA.",
                PhotoUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 1, StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(15, 0, 0)
            },
            new StudentSeedItem {
                Name = "Rafael Diniz Nogueira",
                Level = "Business Essentials",
                Price = 500m,
                City = "São José dos Campos", State = "SP", Phone = "(12) 98822-1100",
                Birth = now.AddYears(-31).AddDays(-210),
                FirstClass = now.AddMonths(-13),
                GuardianName = null, GuardianPhone = null,
                Obs = "Engenheiro Aeroespacial. Apresentações técnicas.",
                PhotoUrl = "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 1, StartTime = new TimeSpan(16, 30, 0), EndTime = new TimeSpan(17, 30, 0)
            },

            // Terça-feira (3 alunos)
            new StudentSeedItem {
                Name = "Beatriz Helena Siqueira",
                Level = "Corporate Leadership",
                Price = 550m,
                City = "Rio de Janeiro", State = "RJ", Phone = "(21) 98877-6655",
                Birth = now.AddYears(-34).AddDays(-80),
                FirstClass = now.AddMonths(-9),
                GuardianName = null, GuardianPhone = null,
                Obs = "Diretora de Operações. Foco em liderança e negociação.",
                PhotoUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 2, StartTime = new TimeSpan(10, 0, 0), EndTime = new TimeSpan(11, 0, 0)
            },
            new StudentSeedItem {
                Name = "Lucas Henrique Silveira",
                Level = "Iniciante (A1-A2)",
                Price = 350m,
                City = "Belo Horizonte", State = "MG", Phone = "(31) 98456-1122",
                Birth = now.AddYears(-17).AddDays(-60),
                FirstClass = now.AddMonths(-6),
                GuardianName = "Cláudia Silveira (Mãe)", GuardianPhone = "(31) 98456-1100",
                Obs = "Aluno do ensino médio. Reforço e preparação para vestibular.",
                PhotoUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 2, StartTime = new TimeSpan(15, 30, 0), EndTime = new TimeSpan(16, 30, 0)
            },
            new StudentSeedItem {
                Name = "Isabella Rocha Campinas",
                Level = "Iniciante (A1-A2)",
                Price = 350m,
                City = "Sorocaba", State = "SP", Phone = "(15) 99188-7766",
                Birth = now.AddYears(-19).AddDays(-95),
                FirstClass = now.AddMonths(-7),
                GuardianName = null, GuardianPhone = null,
                Obs = "Primeiro emprego em multinacional. Foco em pronúncia.",
                PhotoUrl = "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 2, StartTime = new TimeSpan(18, 0, 0), EndTime = new TimeSpan(19, 0, 0)
            },

            // Quarta-feira (2 alunos)
            new StudentSeedItem {
                Name = "Mariana Fontes Duarte",
                Level = "Academic IELTS Focus",
                Price = 480m,
                City = "Curitiba", State = "PR", Phone = "(41) 99881-2233",
                Birth = now.AddYears(-25).AddDays(-200),
                FirstClass = now.AddMonths(-11),
                GuardianName = null, GuardianPhone = null,
                Obs = "Aplicando para mestrado no Canadá. Meta Band 7.5 no IELTS.",
                PhotoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 3, StartTime = new TimeSpan(8, 30, 0), EndTime = new TimeSpan(9, 30, 0)
            },
            new StudentSeedItem {
                Name = "Matheus Ramos Albuquerque",
                Level = "Business Essentials",
                Price = 500m,
                City = "São Paulo", State = "SP", Phone = "(11) 97654-3210",
                Birth = now.AddYears(-29).AddDays(-15),
                FirstClass = now.AddMonths(-8),
                GuardianName = null, GuardianPhone = null,
                Obs = "Gerente de Contas. Foco em redação de propostas e calls.",
                PhotoUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 3, StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(15, 0, 0)
            },

            // Quinta-feira (2 alunos)
            new StudentSeedItem {
                Name = "Sofia Carvalho Guimarães",
                Level = "Intermediário (B1-B2)",
                Price = 380m,
                City = "Florianópolis", State = "SC", Phone = "(48) 99112-3344",
                Birth = now.AddYears(-23).AddDays(-90),
                FirstClass = now.AddMonths(-15),
                GuardianName = null, GuardianPhone = null,
                Obs = "Estudante de Design. Foco em apresentações de portfólio.",
                PhotoUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 4, StartTime = new TimeSpan(9, 30, 0), EndTime = new TimeSpan(10, 30, 0)
            },
            new StudentSeedItem {
                Name = "Thiago Pires Montenegro",
                Level = "Exam Strategies & Speaking",
                Price = 520m,
                City = "Porto Alegre", State = "RS", Phone = "(51) 98765-9988",
                Birth = now.AddYears(-26).AddDays(-300),
                FirstClass = now.AddMonths(-7),
                GuardianName = null, GuardianPhone = null,
                Obs = "Médico buscando validação de diploma no exterior.",
                PhotoUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 4, StartTime = new TimeSpan(16, 0, 0), EndTime = new TimeSpan(17, 0, 0)
            },

            // Sexta-feira (3 alunos)
            new StudentSeedItem {
                Name = "Larissa Viana Toledo",
                Level = "Iniciante (A1-A2)",
                Price = 350m,
                City = "Ribeirão Preto", State = "SP", Phone = "(16) 99234-5678",
                Birth = now.AddYears(-16).AddDays(-110),
                FirstClass = now.AddMonths(-4),
                GuardianName = "Roberto Toledo (Pai)", GuardianPhone = "(16) 99234-5600",
                Obs = "Iniciou do zero. Muito dedicada com tarefas semanais.",
                PhotoUrl = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 5, StartTime = new TimeSpan(10, 0, 0), EndTime = new TimeSpan(11, 0, 0)
            },
            new StudentSeedItem {
                Name = "Felipe Augusto Zanetti",
                Level = "Corporate Leadership",
                Price = 550m,
                City = "São Paulo", State = "SP", Phone = "(11) 99443-2211",
                Birth = now.AddYears(-38).AddDays(-45),
                FirstClass = now.AddMonths(-16),
                GuardianName = null, GuardianPhone = null,
                Obs = "C-Level em Fintech. Conversação avançada e geopolítica.",
                PhotoUrl = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 5, StartTime = new TimeSpan(14, 30, 0), EndTime = new TimeSpan(15, 30, 0)
            },
            new StudentSeedItem {
                Name = "Camilla Rezende Castro",
                Level = "Avançado & Fluência (C1)",
                Price = 420m,
                City = "Santos", State = "SP", Phone = "(13) 98811-2233",
                Birth = now.AddYears(-24).AddDays(-180),
                FirstClass = now.AddMonths(-12),
                GuardianName = null, GuardianPhone = null,
                Obs = "Relações Internacionais. Fluência e debates.",
                PhotoUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 5, StartTime = new TimeSpan(17, 0, 0), EndTime = new TimeSpan(18, 0, 0)
            },

            // Sábado (2 alunos)
            new StudentSeedItem {
                Name = "Pedro Henrique Macedo",
                Level = "Intermediário (B1-B2)",
                Price = 380m,
                City = "Brasília", State = "DF", Phone = "(61) 98122-3344",
                Birth = now.AddYears(-21).AddDays(-75),
                FirstClass = now.AddMonths(-10),
                GuardianName = null, GuardianPhone = null,
                Obs = "Estudante de Economia. Foco em leitura acadêmica e escuta.",
                PhotoUrl = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 6, StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(10, 0, 0)
            },
            new StudentSeedItem {
                Name = "Júlia Martins Mendonça",
                Level = "Academic IELTS Focus",
                Price = 480m,
                City = "Goiânia", State = "GO", Phone = "(62) 99344-5566",
                Birth = now.AddYears(-28).AddDays(-130),
                FirstClass = now.AddMonths(-5),
                GuardianName = null, GuardianPhone = null,
                Obs = "Arquiteta aplicando para visto de trabalho na Austrália.",
                PhotoUrl = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80",
                DayOfWeek = 6, StartTime = new TimeSpan(10, 30, 0), EndTime = new TimeSpan(11, 30, 0)
            }
        };

        var createdStudents = new List<Student>();

        foreach (var def in studentDefs)
        {
            var level = levelMap[def.Level];
            var student = await db.Students
                .FirstOrDefaultAsync(s => s.ProfessorId == professor.Id && s.Name == def.Name && !s.IsDeleted);

            if (student == null)
            {
                student = new Student
                {
                    ProfessorId = professor.Id,
                    SubjectId = level.SubjectId,
                    LevelId = level.Id,
                    Name = def.Name,
                    Phone = def.Phone,
                    City = def.City,
                    State = def.State,
                    Country = "Brasil",
                    BirthDate = def.Birth,
                    FirstClassDate = def.FirstClass,
                    MonthlyPrice = def.Price,
                    IsActive = true,
                    Observation = def.Obs,
                    GuardianName = def.GuardianName,
                    GuardianPhone = def.GuardianPhone,
                    PhotoUrl = def.PhotoUrl,
                    CreatedAt = def.FirstClass,
                    UpdatedAt = now
                };
                db.Students.Add(student);
                await db.SaveChangesAsync();
            }
            else
            {
                // Atualiza foto e dados de contato caso já exista
                student.PhotoUrl = def.PhotoUrl;
                student.City = def.City;
                student.State = def.State;
                student.Phone = def.Phone;
                student.MonthlyPrice = def.Price;
                student.IsActive = true;
                student.UpdatedAt = now;
                await db.SaveChangesAsync();
            }

            createdStudents.Add(student);

            // 4. Horários Semanais Fixos (Schedule) - Distribuídos de Segunda a Sábado
            var existingSchedules = await db.Schedules.Where(sc => sc.StudentId == student.Id).ToListAsync();
            db.Schedules.RemoveRange(existingSchedules);

            db.Schedules.Add(new Schedule
            {
                ProfessorId = professor.Id,
                StudentId = student.Id,
                DayOfWeek = def.DayOfWeek,
                StartTime = def.StartTime,
                EndTime = def.EndTime,
                Frequency = "weekly",
                IsRecurring = true,
                ValidFrom = (student.FirstClassDate ?? now.AddMonths(-6)).Date,
                ValidUntil = null,
                CreatedAt = now,
                UpdatedAt = now
            });

            // 5. Histórico de Aulas (Passadas e Futuras) no dia correto da semana do aluno
            var existingLessons = await db.Lessons.Where(l => l.StudentId == student.Id).ToListAsync();
            db.Lessons.RemoveRange(existingLessons);

            // 4 aulas passadas realizadas
            for (int i = 4; i >= 1; i--)
            {
                var pastDate = GetRecentDateForDayOfWeek(def.DayOfWeek, i, def.StartTime);
                db.Lessons.Add(new Lesson
                {
                    ProfessorId = professor.Id,
                    StudentId = student.Id,
                    Title = $"Aula Regular #{5 - i} - {level.Name}",
                    ScheduledAt = pastDate,
                    DurationMinutes = 60,
                    Status = "completed",
                    Notes = i == 1
                        ? "Ótima assimilação das preposições e pronúncia clara."
                        : i == 2
                            ? "Excelente desempenho na leitura guiada e resolução de dúvidas."
                            : "Participação muito ativa e vocabulário em franca expansão.",
                    CreatedAt = pastDate.AddDays(-1),
                    UpdatedAt = pastDate
                });
            }

            // 2 aulas futuras agendadas
            for (int i = 1; i <= 2; i++)
            {
                var futureDate = GetFutureDateForDayOfWeek(def.DayOfWeek, i, def.StartTime);
                db.Lessons.Add(new Lesson
                {
                    ProfessorId = professor.Id,
                    StudentId = student.Id,
                    Title = $"Aula Regular #{4 + i} - {level.Name}",
                    ScheduledAt = futureDate,
                    DurationMinutes = 60,
                    Status = "scheduled",
                    Notes = "Preparar tópicos práticos e atividade de conversação orientada.",
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            // 6. Provas e Exercícios Tradicionais
            var existingExams = await db.Exams.Where(e => e.StudentId == student.Id).ToListAsync();
            if (!existingExams.Any())
            {
                db.Exams.Add(new Exam
                {
                    StudentId = student.Id,
                    Title = "Avaliação Bimestral - Compreensão Oral & Escrita",
                    ScheduledAt = now.AddDays(-20),
                    Grade = 9.2m,
                    MaxGrade = 10m,
                    Notes = "Excelente aproveitamento geral! Demonstrou grande segurança nos conceitos gramaticais.",
                    CreatedAt = now.AddDays(-25),
                    UpdatedAt = now.AddDays(-20)
                });
            }

            var existingExercises = await db.Exercises.Where(ex => ex.StudentId == student.Id).ToListAsync();
            if (!existingExercises.Any())
            {
                db.Exercises.Add(new Exercise
                {
                    StudentId = student.Id,
                    Title = "Lista de Exercícios Práticos - Vocabulário & Estruturas",
                    ScheduledAt = now.AddDays(-10),
                    Grade = 9.5m,
                    MaxGrade = 10m,
                    Notes = "Exercícios concluídos com muito capricho e dedicação.",
                    CreatedAt = now.AddDays(-12),
                    UpdatedAt = now.AddDays(-10)
                });

                db.Exercises.Add(new Exercise
                {
                    StudentId = student.Id,
                    Title = "Tarefa de Áudio & Pronúncia (Speaking Drill)",
                    ScheduledAt = now.AddDays(-3),
                    Grade = 8.8m,
                    MaxGrade = 10m,
                    Notes = "Pronúncia límpida, ritmo natural e boa entonação.",
                    CreatedAt = now.AddDays(-5),
                    UpdatedAt = now.AddDays(-3)
                });
            }

            // 7. Liberar Fichas Pedagógicas do Nível
            var matchingSheets = createdSheets.Where(cs => cs.LevelId == student.LevelId).ToList();
            foreach (var sh in matchingSheets)
            {
                var isReleased = await db.ClassSheetStudents
                    .AnyAsync(css => css.StudentId == student.Id && css.ClassSheetId == sh.Id);

                if (!isReleased)
                {
                    db.ClassSheetStudents.Add(new ClassSheetStudent
                    {
                        StudentId = student.Id,
                        ClassSheetId = sh.Id
                    });
                }
            }

            // 8. Mensalidades Financeiras (Últimos 3 meses)
            var currentMonth = now.Month;
            var currentYear = now.Year;
            var prevMonth1 = now.AddMonths(-1);
            var prevMonth2 = now.AddMonths(-2);

            var paymentsToCheck = new[]
            {
                new { Month = prevMonth2.Month, Year = prevMonth2.Year, IsPaid = true, PaidAt = (DateTime?)prevMonth2.AddDays(5) },
                new { Month = prevMonth1.Month, Year = prevMonth1.Year, IsPaid = true, PaidAt = (DateTime?)prevMonth1.AddDays(5) },
                new { Month = currentMonth, Year = currentYear, IsPaid = true, PaidAt = (DateTime?)now.AddDays(-2) }
            };

            foreach (var pay in paymentsToCheck)
            {
                var exists = await db.MonthlyPayments
                    .AnyAsync(mp => mp.StudentId == student.Id && mp.Month == pay.Month && mp.Year == pay.Year && !mp.IsDeleted);

                if (!exists)
                {
                    db.MonthlyPayments.Add(new MonthlyPayment
                    {
                        StudentId = student.Id,
                        Month = pay.Month,
                        Year = pay.Year,
                        Amount = student.MonthlyPrice,
                        IsPaid = pay.IsPaid,
                        PaidAt = pay.PaidAt,
                        CreatedAt = new DateTime(pay.Year, pay.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                        UpdatedAt = now
                    });
                }
            }
        }

        await db.SaveChangesAsync();

        // 9. PROVAS E EXERCÍCIOS ONLINE (Templates e Atribuições com Respostas e Correções)
        var templateQuiz = await db.TemplateActivities
            .Include(t => t.Questions)
            .FirstOrDefaultAsync(t => t.ProfessorId == professor.Id && t.Title == "Quiz Online: Preposições & Gramática");

        if (templateQuiz == null)
        {
            var interLevel = levelMap["Intermediário (B1-B2)"];
            templateQuiz = new TemplateActivity
            {
                ProfessorId = professor.Id,
                SubjectId = interLevel.SubjectId,
                LevelId = interLevel.Id,
                Title = "Quiz Online: Preposições & Gramática",
                Type = "exercise",
                MaxGrade = 10.0m,
                CreatedAt = now.AddDays(-20),
                UpdatedAt = now.AddDays(-20)
            };
            db.TemplateActivities.Add(templateQuiz);
            await db.SaveChangesAsync();

            db.TemplateQuestions.AddRange(new[]
            {
                new TemplateQuestion
                {
                    TemplateActivityId = templateQuiz.Id,
                    QuestionText = "Complete the sentence: 'We will meet you ___ the airport at 6:00 PM.'",
                    QuestionType = "multiple_choice",
                    OptionA = "in",
                    OptionB = "on",
                    OptionC = "at",
                    OptionD = "to",
                    CorrectOption = 'C',
                    Weight = 3.0m,
                    CreatedAt = now.AddDays(-20),
                    UpdatedAt = now.AddDays(-20)
                },
                new TemplateQuestion
                {
                    TemplateActivityId = templateQuiz.Id,
                    QuestionText = "Complete the sentence: 'The final report was sent ___ Monday morning.'",
                    QuestionType = "multiple_choice",
                    OptionA = "in",
                    OptionB = "on",
                    OptionC = "at",
                    OptionD = "with",
                    CorrectOption = 'B',
                    Weight = 3.0m,
                    CreatedAt = now.AddDays(-20),
                    UpdatedAt = now.AddDays(-20)
                },
                new TemplateQuestion
                {
                    TemplateActivityId = templateQuiz.Id,
                    QuestionText = "Write two original sentences describing your daily routine using 'in the morning' and 'at night'.",
                    QuestionType = "writing",
                    Weight = 4.0m,
                    CreatedAt = now.AddDays(-20),
                    UpdatedAt = now.AddDays(-20)
                }
            });
            await db.SaveChangesAsync();
        }

        var templateExam = await db.TemplateActivities
            .Include(t => t.Questions)
            .FirstOrDefaultAsync(t => t.ProfessorId == professor.Id && t.Title == "Prova Online Bimestral: Business English");

        if (templateExam == null)
        {
            var busLevel = levelMap["Business Essentials"];
            templateExam = new TemplateActivity
            {
                ProfessorId = professor.Id,
                SubjectId = busLevel.SubjectId,
                LevelId = busLevel.Id,
                Title = "Prova Online Bimestral: Business English",
                Type = "exam",
                MaxGrade = 10.0m,
                CreatedAt = now.AddDays(-25),
                UpdatedAt = now.AddDays(-25)
            };
            db.TemplateActivities.Add(templateExam);
            await db.SaveChangesAsync();

            db.TemplateQuestions.AddRange(new[]
            {
                new TemplateQuestion
                {
                    TemplateActivityId = templateExam.Id,
                    QuestionText = "Which phrase is the most formal and appropriate for a follow-up email?",
                    QuestionType = "multiple_choice",
                    OptionA = "Tell me what happened.",
                    OptionB = "I would appreciate an update on this matter at your earliest convenience.",
                    OptionC = "What's up with the project?",
                    OptionD = "Send me news now.",
                    CorrectOption = 'B',
                    Weight = 4.0m,
                    CreatedAt = now.AddDays(-25),
                    UpdatedAt = now.AddDays(-25)
                },
                new TemplateQuestion
                {
                    TemplateActivityId = templateExam.Id,
                    QuestionText = "Draft a short email proposing a meeting reschedule with a strategic client.",
                    QuestionType = "writing",
                    Weight = 6.0m,
                    CreatedAt = now.AddDays(-25),
                    UpdatedAt = now.AddDays(-25)
                }
            });
            await db.SaveChangesAsync();
        }

        // Atribuir Atividades Online aos Alunos com status variados (completed com nota, corrigir e pending)
        var anaStudent = createdStudents.FirstOrDefault(s => s.Name.StartsWith("Ana Cecília"));
        if (anaStudent != null)
        {
            var hasAnaAct = await db.StudentActivities.AnyAsync(sa => sa.StudentId == anaStudent.Id && sa.TemplateActivityId == templateQuiz.Id);
            if (!hasAnaAct)
            {
                var act = new StudentActivity
                {
                    StudentId = anaStudent.Id,
                    TemplateActivityId = templateQuiz.Id,
                    ScheduledAt = now.AddDays(-5),
                    CompletedAt = now.AddDays(-4),
                    Grade = 9.5m,
                    MaxGrade = 10.0m,
                    Status = "completed",
                    CreatedAt = now.AddDays(-5),
                    UpdatedAt = now.AddDays(-4)
                };
                db.StudentActivities.Add(act);
                await db.SaveChangesAsync();

                db.StudentAnswers.AddRange(new[]
                {
                    new StudentAnswer
                    {
                        StudentActivityId = act.Id,
                        QuestionText = "Complete the sentence: 'We will meet you ___ the airport at 6:00 PM.'",
                        QuestionType = "multiple_choice",
                        OptionA = "in", OptionB = "on", OptionC = "at", OptionD = "to",
                        CorrectOption = 'C',
                        SelectedOption = 'C',
                        EvaluationScore = 3.0m,
                        EvaluationMention = "Excelente",
                        EvaluationNotes = "Correto! Uso perfeito de 'at' para ponto de encontro.",
                        Weight = 3.0m
                    },
                    new StudentAnswer
                    {
                        StudentActivityId = act.Id,
                        QuestionText = "Complete the sentence: 'The final report was sent ___ Monday morning.'",
                        QuestionType = "multiple_choice",
                        OptionA = "in", OptionB = "on", OptionC = "at", OptionD = "with",
                        CorrectOption = 'B',
                        SelectedOption = 'B',
                        EvaluationScore = 3.0m,
                        EvaluationMention = "Excelente",
                        EvaluationNotes = "Correto! Dias da semana levam 'on'.",
                        Weight = 3.0m
                    },
                    new StudentAnswer
                    {
                        StudentActivityId = act.Id,
                        QuestionText = "Write two original sentences describing your daily routine using 'in the morning' and 'at night'.",
                        QuestionType = "writing",
                        WrittenAnswer = "I usually drink black coffee and read the news in the morning. At night, I review my vocabulary notes before going to bed.",
                        EvaluationScore = 3.5m,
                        EvaluationMention = "Excelente",
                        EvaluationNotes = "Excelente vocabulário, fluidez e pontuação correta!",
                        Weight = 4.0m
                    }
                });
            }
        }

        var matheusStudent = createdStudents.FirstOrDefault(s => s.Name.StartsWith("Matheus Ramos"));
        if (matheusStudent != null)
        {
            var hasMatheusAct = await db.StudentActivities.AnyAsync(sa => sa.StudentId == matheusStudent.Id && sa.TemplateActivityId == templateExam.Id);
            if (!hasMatheusAct)
            {
                // Status "corrigir" (aluno concluiu online e o professor precisa corrigir a dissertativa!)
                var act = new StudentActivity
                {
                    StudentId = matheusStudent.Id,
                    TemplateActivityId = templateExam.Id,
                    ScheduledAt = now.AddDays(-2),
                    CompletedAt = now.AddDays(-1),
                    Grade = null, // Aguardando correção do professor!
                    MaxGrade = 10.0m,
                    Status = "corrigir",
                    CreatedAt = now.AddDays(-2),
                    UpdatedAt = now.AddDays(-1)
                };
                db.StudentActivities.Add(act);
                await db.SaveChangesAsync();

                db.StudentAnswers.AddRange(new[]
                {
                    new StudentAnswer
                    {
                        StudentActivityId = act.Id,
                        QuestionText = "Which phrase is the most formal and appropriate for a follow-up email?",
                        QuestionType = "multiple_choice",
                        OptionA = "Tell me what happened.",
                        OptionB = "I would appreciate an update on this matter at your earliest convenience.",
                        OptionC = "What's up with the project?",
                        OptionD = "Send me news now.",
                        CorrectOption = 'B',
                        SelectedOption = 'B',
                        EvaluationScore = 4.0m,
                        EvaluationMention = "Excelente",
                        Weight = 4.0m
                    },
                    new StudentAnswer
                    {
                        StudentActivityId = act.Id,
                        QuestionText = "Draft a short email proposing a meeting reschedule with a strategic client.",
                        QuestionType = "writing",
                        WrittenAnswer = "Dear Mr. Davis, Due to an unexpected schedule conflict, I would like to kindly propose rescheduling our sync to tomorrow at 3:00 PM. Best regards, Matheus.",
                        EvaluationScore = null, // Aguardando nota do professor
                        EvaluationMention = null,
                        Weight = 6.0m
                    }
                });
            }
        }

        var sofiaStudent = createdStudents.FirstOrDefault(s => s.Name.StartsWith("Sofia Carvalho"));
        if (sofiaStudent != null)
        {
            var hasSofiaAct = await db.StudentActivities.AnyAsync(sa => sa.StudentId == sofiaStudent.Id && sa.TemplateActivityId == templateQuiz.Id);
            if (!hasSofiaAct)
            {
                // Status "pending" (pendente para a aluna realizar no portal)
                db.StudentActivities.Add(new StudentActivity
                {
                    StudentId = sofiaStudent.Id,
                    TemplateActivityId = templateQuiz.Id,
                    ScheduledAt = now.AddDays(2),
                    CompletedAt = null,
                    Grade = null,
                    MaxGrade = 10.0m,
                    Status = "pending",
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }

        var beatrizStudent = createdStudents.FirstOrDefault(s => s.Name.StartsWith("Beatriz Helena"));
        if (beatrizStudent != null)
        {
            var hasBeatrizAct = await db.StudentActivities.AnyAsync(sa => sa.StudentId == beatrizStudent.Id && sa.TemplateActivityId == templateExam.Id);
            if (!hasBeatrizAct)
            {
                db.StudentActivities.Add(new StudentActivity
                {
                    StudentId = beatrizStudent.Id,
                    TemplateActivityId = templateExam.Id,
                    ScheduledAt = now.AddDays(-8),
                    CompletedAt = now.AddDays(-7),
                    Grade = 9.8m,
                    MaxGrade = 10.0m,
                    Status = "completed",
                    CreatedAt = now.AddDays(-8),
                    UpdatedAt = now.AddDays(-7)
                });
            }

            var hasBeatrizCert = await db.Certificates.AnyAsync(c => c.StudentId == beatrizStudent.Id && !c.IsDeleted);
            if (!hasBeatrizCert)
            {
                db.Certificates.Add(new Certificate
                {
                    ProfessorId = professor.Id,
                    StudentId = beatrizStudent.Id,
                    Title = "Certificado de Conclusão - Inglês Avançado & Fluência (C1)",
                    Description = "Concluiu com aproveitamento e distinção todas as metas de fluência oral, conversação corporativa e produção textual acadêmica.",
                    FileUrl = "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&auto=format&fit=crop&q=80",
                    FileType = "image",
                    FileName = "Certificado_Ingles_C1_Beatriz.jpg",
                    IssueDate = now.AddDays(-15),
                    CreatedAt = now.AddDays(-15)
                });
            }
        }

        var lucasStudent = createdStudents.FirstOrDefault(s => s.Name.StartsWith("Lucas Gabriel"));
        if (lucasStudent != null)
        {
            var hasLucasCert = await db.Certificates.AnyAsync(c => c.StudentId == lucasStudent.Id && !c.IsDeleted);
            if (!hasLucasCert)
            {
                db.Certificates.Add(new Certificate
                {
                    ProfessorId = professor.Id,
                    StudentId = lucasStudent.Id,
                    Title = "Certificado de Nível Básico (A1-A2) - English Fundamentals",
                    Description = "Excelente desempenho nas provas avaliativas e dedicação consistente aos exercícios práticos.",
                    FileUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
                    FileType = "image",
                    FileName = "Certificado_Ingles_A2_Lucas.jpg",
                    IssueDate = now.AddDays(-20),
                    CreatedAt = now.AddDays(-20)
                });
            }
        }

        await db.SaveChangesAsync();
    }
}

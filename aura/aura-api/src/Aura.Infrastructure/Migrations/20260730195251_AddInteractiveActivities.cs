using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInteractiveActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TemplateActivities",
                schema: "aura",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfessorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    LevelId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "exercise"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateActivities_Levels_LevelId",
                        column: x => x.LevelId,
                        principalSchema: "aura",
                        principalTable: "Levels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TemplateActivities_Professors_ProfessorId",
                        column: x => x.ProfessorId,
                        principalSchema: "aura",
                        principalTable: "Professors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TemplateActivities_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalSchema: "aura",
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentActivities",
                schema: "aura",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Grade = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    MaxGrade = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 10m),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentActivities_Students_StudentId",
                        column: x => x.StudentId,
                        principalSchema: "aura",
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentActivities_TemplateActivities_TemplateActivityId",
                        column: x => x.TemplateActivityId,
                        principalSchema: "aura",
                        principalTable: "TemplateActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemplateQuestions",
                schema: "aura",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    OptionA = table.Column<string>(type: "text", nullable: false),
                    OptionB = table.Column<string>(type: "text", nullable: false),
                    OptionC = table.Column<string>(type: "text", nullable: false),
                    OptionD = table.Column<string>(type: "text", nullable: false),
                    CorrectOption = table.Column<char>(type: "character(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateQuestions_TemplateActivities_TemplateActivityId",
                        column: x => x.TemplateActivityId,
                        principalSchema: "aura",
                        principalTable: "TemplateActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentAnswers",
                schema: "aura",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    OptionA = table.Column<string>(type: "text", nullable: false),
                    OptionB = table.Column<string>(type: "text", nullable: false),
                    OptionC = table.Column<string>(type: "text", nullable: false),
                    OptionD = table.Column<string>(type: "text", nullable: false),
                    CorrectOption = table.Column<char>(type: "character(1)", nullable: false),
                    SelectedOption = table.Column<char>(type: "character(1)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAnswers_StudentActivities_StudentActivityId",
                        column: x => x.StudentActivityId,
                        principalSchema: "aura",
                        principalTable: "StudentActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentActivities_StudentId",
                schema: "aura",
                table: "StudentActivities",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentActivities_TemplateActivityId",
                schema: "aura",
                table: "StudentActivities",
                column: "TemplateActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnswers_StudentActivityId",
                schema: "aura",
                table: "StudentAnswers",
                column: "StudentActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateActivities_LevelId",
                schema: "aura",
                table: "TemplateActivities",
                column: "LevelId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateActivities_ProfessorId",
                schema: "aura",
                table: "TemplateActivities",
                column: "ProfessorId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateActivities_SubjectId",
                schema: "aura",
                table: "TemplateActivities",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateQuestions_TemplateActivityId",
                schema: "aura",
                table: "TemplateQuestions",
                column: "TemplateActivityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentAnswers",
                schema: "aura");

            migrationBuilder.DropTable(
                name: "TemplateQuestions",
                schema: "aura");

            migrationBuilder.DropTable(
                name: "StudentActivities",
                schema: "aura");

            migrationBuilder.DropTable(
                name: "TemplateActivities",
                schema: "aura");
        }
    }
}

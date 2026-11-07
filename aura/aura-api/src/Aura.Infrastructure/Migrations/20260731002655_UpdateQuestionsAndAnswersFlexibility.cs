using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuestionsAndAnswersFlexibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                schema: "aura",
                table: "TemplateQuestions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EvaluationMention",
                schema: "aura",
                table: "StudentAnswers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EvaluationScore",
                schema: "aura",
                table: "StudentAnswers",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                schema: "aura",
                table: "StudentAnswers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WrittenAnswer",
                schema: "aura",
                table: "StudentAnswers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuestionType",
                schema: "aura",
                table: "TemplateQuestions");

            migrationBuilder.DropColumn(
                name: "EvaluationMention",
                schema: "aura",
                table: "StudentAnswers");

            migrationBuilder.DropColumn(
                name: "EvaluationScore",
                schema: "aura",
                table: "StudentAnswers");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                schema: "aura",
                table: "StudentAnswers");

            migrationBuilder.DropColumn(
                name: "WrittenAnswer",
                schema: "aura",
                table: "StudentAnswers");
        }
    }
}

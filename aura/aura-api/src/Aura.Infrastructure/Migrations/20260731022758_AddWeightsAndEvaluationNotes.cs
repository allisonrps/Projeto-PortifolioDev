using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeightsAndEvaluationNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                schema: "aura",
                table: "TemplateQuestions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "EvaluationNotes",
                schema: "aura",
                table: "StudentAnswers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                schema: "aura",
                table: "StudentAnswers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Weight",
                schema: "aura",
                table: "TemplateQuestions");

            migrationBuilder.DropColumn(
                name: "EvaluationNotes",
                schema: "aura",
                table: "StudentAnswers");

            migrationBuilder.DropColumn(
                name: "Weight",
                schema: "aura",
                table: "StudentAnswers");
        }
    }
}

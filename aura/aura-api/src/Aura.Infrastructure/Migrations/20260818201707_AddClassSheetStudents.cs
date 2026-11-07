using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSheetStudents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClassSheetStudents",
                schema: "aura",
                columns: table => new
                {
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassSheetId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassSheetStudents", x => new { x.StudentId, x.ClassSheetId });
                    table.ForeignKey(
                        name: "FK_ClassSheetStudents_ClassSheets_ClassSheetId",
                        column: x => x.ClassSheetId,
                        principalSchema: "aura",
                        principalTable: "ClassSheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassSheetStudents_Students_StudentId",
                        column: x => x.StudentId,
                        principalSchema: "aura",
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClassSheetStudents_ClassSheetId",
                schema: "aura",
                table: "ClassSheetStudents",
                column: "ClassSheetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassSheetStudents",
                schema: "aura");
        }
    }
}

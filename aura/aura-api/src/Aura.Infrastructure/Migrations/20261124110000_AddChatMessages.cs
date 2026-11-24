using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS aura.""ChatMessages"" (
    ""Id"" uuid NOT NULL,
    ""ProfessorId"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""SenderType"" integer NOT NULL,
    ""Content"" character varying(4000) NOT NULL,
    ""IsReadByProfessor"" boolean NOT NULL DEFAULT FALSE,
    ""IsReadByStudent"" boolean NOT NULL DEFAULT FALSE,
    ""CreatedAt"" timestamp without time zone NOT NULL,
    ""UpdatedAt"" timestamp without time zone NULL,
    ""IsDeleted"" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT ""PK_ChatMessages"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_ChatMessages_Professors_ProfessorId"" FOREIGN KEY (""ProfessorId"") REFERENCES aura.""Professors"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_ChatMessages_Students_StudentId"" FOREIGN KEY (""StudentId"") REFERENCES aura.""Students"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_ChatMessages_StudentId_CreatedAt"" ON aura.""ChatMessages"" (""StudentId"", ""CreatedAt"");
CREATE INDEX IF NOT EXISTS ""IX_ChatMessages_ProfessorId_IsReadByProfessor_IsDeleted"" ON aura.""ChatMessages"" (""ProfessorId"", ""IsReadByProfessor"", ""IsDeleted"");
CREATE INDEX IF NOT EXISTS ""IX_ChatMessages_StudentId_IsReadByStudent_IsDeleted"" ON aura.""ChatMessages"" (""StudentId"", ""IsReadByStudent"", ""IsDeleted"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS aura.""ChatMessages"";");
        }
    }
}

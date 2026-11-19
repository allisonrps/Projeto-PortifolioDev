using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aura.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS aura.""Certificates"" (
    ""Id"" uuid NOT NULL,
    ""ProfessorId"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""Title"" character varying(200) NOT NULL,
    ""Description"" text NULL,
    ""FileUrl"" text NOT NULL,
    ""FileType"" text NULL,
    ""FileName"" text NULL,
    ""IssueDate"" timestamp without time zone NOT NULL,
    ""CreatedAt"" timestamp without time zone NOT NULL,
    ""UpdatedAt"" timestamp without time zone NULL,
    ""IsDeleted"" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT ""PK_Certificates"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_Certificates_Professors_ProfessorId"" FOREIGN KEY (""ProfessorId"") REFERENCES aura.""Professors"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_Certificates_Students_StudentId"" FOREIGN KEY (""StudentId"") REFERENCES aura.""Students"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_Certificates_ProfessorId_IsDeleted"" ON aura.""Certificates"" (""ProfessorId"", ""IsDeleted"");
CREATE INDEX IF NOT EXISTS ""IX_Certificates_StudentId_IsDeleted"" ON aura.""Certificates"" (""StudentId"", ""IsDeleted"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS aura.""Certificates"";");
        }
    }
}

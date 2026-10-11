using System.Text.RegularExpressions;
using FormManagementApi.Data;
using FormManagementApi.Entities;
using FormManagementApi.Features.Forms.Shared.Schema;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace FormManagementApi.Tests;

public sealed class SqlFactAttribute : FactAttribute
{
    public SqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FORM_SCHEMA_TEST_SQL")))
            Skip = "Set FORM_SCHEMA_TEST_SQL for isolated SQL Server integration tests.";
    }
}

internal sealed class SqlSchemaTestHost : IAsyncDisposable
{
    private readonly string masterConnection;
    private readonly string databaseName;
    public string ConnectionString { get; }
    public WebApplicationFactory<Program>? Factory { get; private set; }
    public HttpClient Client => Factory!.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
    public static string Migration => File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Migrations", "001_PersistFormSchemaV1.sql"));
    public static string LifecycleMigration => File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Migrations", "002_FormVersionLifecycleGuardrails.sql"));
    public static string Complete => File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Contracts", "examples", "complete.json"));
    public static string Empty => FormSchemaSerializer.Serialize(new FormSchemaDocument { SchemaVersion = 1, Sections = [] });

    private SqlSchemaTestHost(string configured)
    {
        var connection = new SqlConnectionStringBuilder(configured);
        if (connection.InitialCatalog != "form_schema_tests")
            throw new InvalidOperationException("Tests require Initial Catalog=form_schema_tests; development databases cannot be used.");
        databaseName = "form_schema_tests_" + Guid.NewGuid().ToString("N");
        connection.InitialCatalog = "master";
        masterConnection = connection.ConnectionString;
        connection.InitialCatalog = databaseName;
        ConnectionString = connection.ConnectionString;
    }

    public static async Task<SqlSchemaTestHost> Create(bool migrate = true, SaveChangesInterceptor? interceptor = null)
    {
        var host = new SqlSchemaTestHost(Environment.GetEnvironmentVariable("FORM_SCHEMA_TEST_SQL")!);
        try
        {
            await using (var connection = new SqlConnection(host.masterConnection))
            {
                await connection.OpenAsync();
                await using var command = new SqlCommand($"CREATE DATABASE [{host.databaseName}]", connection);
                await command.ExecuteNonQueryAsync();
            }
            // The local model database may contain application tables. Reset only our newly created disposable copy.
            await host.Execute("DROP TABLE IF EXISTS dbo.FormVersions; DROP TABLE IF EXISTS dbo.Forms;");
            var baseline = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Migrations", "Baseline.sql"));
            foreach (var batch in Regex.Split(baseline, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
                if (!string.IsNullOrWhiteSpace(batch)) await host.Execute(batch);
            if (migrate)
            {
                await host.Execute(Migration);
                await host.Execute(LifecycleMigration);
            }
            host.Factory = new SchemaApplicationFactory(host.ConnectionString, interceptor);
            return host;
        }
        catch { await host.DisposeAsync(); throw; }
    }

    public AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(ConnectionString).Options);

    public async Task Execute(string sql, params SqlParameter[] parameters)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection) { CommandTimeout = 60 };
        command.Parameters.AddRange(parameters);
        await command.ExecuteNonQueryAsync();
    }

    public async Task<object?> Scalar(string sql)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        return await command.ExecuteScalarAsync();
    }

    public async Task<FormVersion> Seed(string? schema = null, string status = "Draft", Guid? sourceId = null, Guid? versionId = null)
    {
        await using var context = Context();
        var version = new FormVersion
        {
            Id = versionId ?? Guid.NewGuid(),
            Form = new Form { Name = "Isolated schema test", CreatedAt = DateTime.UtcNow, IsActive = true },
            VersionNumber = 1, Status = status, SchemaJson = schema ?? Empty,
            CreatedAt = DateTime.UtcNow, DerivedFromVersionId = sourceId
        };
        context.FormVersions.Add(version);
        await context.SaveChangesAsync();
        return version;
    }

    public async Task<FormVersion> SeedVersion(Guid formId, int versionNumber, string status,
        string? schema = null, Guid? sourceId = null, Guid? id = null)
    {
        await using var context = Context();
        var version = new FormVersion
        {
            Id = id ?? Guid.NewGuid(),
            FormId = formId,
            VersionNumber = versionNumber, Status = status, SchemaJson = schema ?? Empty,
            CreatedAt = DateTime.UtcNow, DerivedFromVersionId = sourceId
        };
        context.FormVersions.Add(version);
        await context.SaveChangesAsync();
        return version;
    }

    public async ValueTask DisposeAsync()
    {
        if (Factory != null) await Factory.DisposeAsync();
        SqlConnection.ClearAllPools();
        await using var connection = new SqlConnection(masterConnection);
        await connection.OpenAsync();
        // Only the unique database created by this instance can be removed.
        await using var command = new SqlCommand($"IF DB_ID(N'{databaseName}') IS NOT NULL BEGIN ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{databaseName}]; END", connection);
        await command.ExecuteNonQueryAsync();
    }

    private sealed class SchemaApplicationFactory(string connection, SaveChangesInterceptor? interceptor) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<AppDbContext>();
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseSqlServer(connection);
                    if (interceptor != null) options.AddInterceptors(interceptor);
                });
            });
        }
    }
}

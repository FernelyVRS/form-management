using System.Security.Claims;
using Carter;
using FormManagementApi.Data;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DockerConnection")));

builder.Services.AddOpenApi();
builder.Services.AddCarter();
builder.Services.AddCors(options =>
{
     options.AddDefaultPolicy(policy =>
     {
         policy.WithOrigins("http://localhost:5173") // your frontend origin
             .AllowAnyHeader()
             .AllowAnyMethod();
     });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTheme(ScalarTheme.Moon);
        options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        options.WithTitle("FormManagementApi 🚀");
    });
}

app.UseCors();

app.UseHttpsRedirection();

app.MapCarter();

app.Run();

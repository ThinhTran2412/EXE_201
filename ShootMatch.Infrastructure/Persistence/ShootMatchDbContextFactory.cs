using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class ShootMatchDbContextFactory : IDesignTimeDbContextFactory<ShootMatchDbContext>
{
    public ShootMatchDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ShootMatchDbContext>();
        
        // Build configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../ShootMatch.Api"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("SHOOTMATCH_CONNECTION_STRING")
            ?? "Host=localhost;Database=shootmatch;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);
        return new ShootMatchDbContext(optionsBuilder.Options);
    }
}


using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShootMatch.Application.Abstractions;
using ShootMatch.Infrastructure.Ai;
using ShootMatch.Infrastructure.Auth;
using ShootMatch.Infrastructure.Persistence;
using ShootMatch.Infrastructure.Storage;

namespace ShootMatch.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Database ─────────────────────────────────────────────────────────
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is required. Set it in appsettings.json or environment variables.");

        services.AddDbContext<ShootMatchDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<DomainEventDispatcher>();

        // ── AI ───────────────────────────────────────────────────────────────
        services.AddSingleton<IEmbeddingEncoder, StubSiglipEncoder>();

        // ── Repositories (EF Core / PostgreSQL) ──────────────────────────────
        services.AddScoped<ICustomerRepository,              EfCustomerRepository>();
        services.AddScoped<IPhotographerRepository,          EfPhotographerRepository>();
        services.AddScoped<IAuthSessionRepository,           EfAuthSessionRepository>();
        services.AddScoped<IMatchRepository,                 EfMatchRepository>();
        services.AddScoped<IBookingRepository,               EfBookingRepository>();
        services.AddScoped<IReviewRepository,                EfReviewRepository>();
        services.AddScoped<IConversationRepository,          EfConversationRepository>();
        services.AddScoped<IConversationQueryService,        EfConversationQueryService>();
        services.AddScoped<ICallSessionRepository,           EfCallSessionRepository>();
        services.AddScoped<IVerificationRequestRepository,   EfVerificationRequestRepository>();

        // ── Still InMemory (no EF model yet — replace when ready) ────────────
        services.AddSingleton<IMatchResultStore,        InMemoryMatchResultStore>();
        services.AddSingleton<ISearchSessionRepository, InMemorySearchSessionRepository>();
        services.AddSingleton<ISwipeActionRepository,   InMemorySwipeActionRepository>();

        // ── Auth services ────────────────────────────────────────────────────
        services.AddSingleton<IOtpService,       InMemoryOtpService>();
        services.AddSingleton<IAuthTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher,      BcryptPasswordHasher>();
        services.AddScoped<IGoogleAuthService,   GoogleAuthService>();

        // ── Storage (Supabase if configured, otherwise local disk) ───────────
        var supabaseKey = configuration["Supabase:ServiceKey"];
        var hasSupabase = !string.IsNullOrWhiteSpace(configuration["Supabase:Url"])
            && !string.IsNullOrWhiteSpace(supabaseKey)
            && !supabaseKey.Contains("SUPABASE_SERVICE_KEY_HERE", StringComparison.OrdinalIgnoreCase);
        if (hasSupabase)
            services.AddScoped<IStorageService, SupabaseStorageService>();
        else
            services.AddScoped<IStorageService, LocalDiskStorageService>();

        return services;
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
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

        services.AddDbContextFactory<ShootMatchDbContext>(options =>
            options.UseNpgsql(connectionString)
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        services.AddScoped<ShootMatchDbContext>(p =>
            p.GetRequiredService<IDbContextFactory<ShootMatchDbContext>>().CreateDbContext());

        services.AddScoped<DomainEventDispatcher>();

        // ── AI ───────────────────────────────────────────────────────────────
        services.AddSingleton<IEmbeddingEncoder, StubSiglipEncoder>();

        // ── Repositories (EF Core / PostgreSQL) ──────────────────────────────
        services.AddScoped<ICustomerRepository,              EfCustomerRepository>();
        services.AddScoped<IPhotographerRepository,          EfPhotographerRepository>();
        services.AddScoped<IStaffRepository,                 EfStaffRepository>();
        services.AddScoped<IAuthSessionRepository,           EfAuthSessionRepository>();
        services.AddScoped<IMatchRepository,                 EfMatchRepository>();
        services.AddScoped<IBookingRepository,               EfBookingRepository>();
        services.AddScoped<IReviewRepository,                EfReviewRepository>();
        services.AddScoped<IConversationRepository,          EfConversationRepository>();
        services.AddScoped<INotificationRepository,          EfNotificationRepository>();
        services.AddScoped<IChatImageService,                ChatImageService>();
        services.AddScoped<IConversationQueryService,        EfConversationQueryService>();
        services.AddHostedService<HostedServices.ChatMediaDowngradeHostedService>();
        services.AddScoped<ICallSessionRepository,           EfCallSessionRepository>();
        services.AddScoped<IVerificationRequestRepository,   EfVerificationRequestRepository>();
        services.AddScoped<IServicePackageRepository,        EfServicePackageRepository>();
        services.AddScoped<IPhotographerAvailabilityRepository, EfPhotographerAvailabilityRepository>();

        // ── Still InMemory (no EF model yet — replace when ready) ────────────
        services.AddSingleton<IMatchResultStore,        InMemoryMatchResultStore>();
        services.AddSingleton<ISearchSessionRepository, InMemorySearchSessionRepository>();
        services.AddSingleton<ISwipeActionRepository,   InMemorySwipeActionRepository>();

        // ── Auth services ────────────────────────────────────────────────────
        services.AddSingleton<IOtpService,       InMemoryOtpService>();
        services.AddSingleton<IAuthTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher,      BcryptPasswordHasher>();
        services.AddScoped<IGoogleAuthService,   GoogleAuthService>();
        services.AddSingleton<IPaymentService,   Services.PayOsPaymentService>();
        services.AddScoped<IEmailService,        Services.SmtpEmailService>();

        // ── Storage (Always Local disk as requested) ───────────
        services.AddScoped<IStorageService, LocalDiskStorageService>();

        return services;
    }
}

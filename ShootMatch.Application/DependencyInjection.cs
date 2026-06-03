using Microsoft.Extensions.DependencyInjection;
using ShootMatch.Application.Commands;
using ShootMatch.Application.Queries;
using ShootMatch.Application.Services;
using ShootMatch.Domain.Abstractions;
using ShootMatch.Domain.Events;

namespace ShootMatch.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // ── Services / Orchestrators ──
        services.AddScoped<MatchingOrchestrator>();
        services.AddScoped<AuthService>();
        services.AddScoped<CustomerService>();
        services.AddScoped<PhotographerAuthService>();
        services.AddScoped<StaffAuthService>();

        // ── Command handlers ──
        services.AddScoped<CreateMatchSearchCommandHandler>();
        services.AddScoped<RecordSwipeCommandHandler>();
        services.AddScoped<MatchCreatedHandler>();          // domain event handler — must register before SwipeRightRecordedHandler
        services.AddScoped<SwipeRightRecordedHandler>();    // depends on MatchCreatedHandler
        services.AddScoped<CreateBookingCommandHandler>();
        services.AddScoped<SubmitReviewCommandHandler>();
        services.AddScoped<SendMessageCommandHandler>();
        services.AddScoped<InitiateCallCommandHandler>();
        services.AddScoped<UpdateCallSessionCommandHandler>();
        services.AddScoped<MarkConversationReadCommandHandler>();
        services.AddScoped<CloseStaleCallsCommandHandler>();

        // ── Domain Event Handler registrations (for DomainEventDispatcher) ──
        // These allow the dispatcher to resolve IDomainEventHandler<MatchCreated> from DI.
        services.AddScoped<IDomainEventHandler<MatchCreated>>(
            sp => sp.GetRequiredService<MatchCreatedHandler>());

        // ── Query handlers ──
        services.AddScoped<GetSwipeFeedQueryHandler>();

        return services;
    }
}

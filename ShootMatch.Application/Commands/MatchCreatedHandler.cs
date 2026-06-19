using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Services;
using ShootMatch.Domain.Abstractions;
using ShootMatch.Domain.Entities;
using ShootMatch.Domain.Events;

namespace ShootMatch.Application.Commands;

/// <summary>
/// Handles MatchCreated domain event.
/// 
/// Action: Creates a Conversation record so that the matched Customer and Photographer
/// can communicate via the /hubs/chat SignalR Hub.
/// 
/// Idempotent: if a Conversation already exists for this MatchId (duplicate dispatch), skip.
/// </summary>
public sealed class MatchCreatedHandler(
    IConversationRepository conversationRepository,
    NotificationService notificationService)
    : IDomainEventHandler<MatchCreated>
{
    public async Task HandleAsync(
        MatchCreated domainEvent,
        CancellationToken cancellationToken = default)
    {
        // Idempotency: don't create a second conversation for the same match
        var existing = await conversationRepository.GetConversationByMatchIdAsync(
            domainEvent.MatchId, cancellationToken);

        if (existing is not null) return;

        var conversation = new Conversation
        {
            Id             = Guid.NewGuid(),
            MatchId        = domainEvent.MatchId,
            CustomerId     = domainEvent.CustomerId,
            PhotographerId = domainEvent.PhotographerId,
            Status         = "Active",
            CreatedAt      = domainEvent.OccurredAt
        };

        await conversationRepository.SaveConversationAsync(conversation, cancellationToken);

        await notificationService.NotifyMatchCreatedAsync(
            domainEvent.CustomerId,
            domainEvent.PhotographerId,
            domainEvent.MatchId,
            cancellationToken);
    }
}

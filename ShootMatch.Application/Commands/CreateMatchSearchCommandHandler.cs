using ShootMatch.Application.Contracts;
using ShootMatch.Application.Services;

namespace ShootMatch.Application.Commands;

public sealed class CreateMatchSearchCommandHandler(MatchingOrchestrator orchestrator)
{
    public Task<MatchSearchResult> HandleAsync(CreateMatchSearchCommand command, CancellationToken cancellationToken)
    {
        return orchestrator.SearchAsync(new MatchSearchRequest
        {
            CustomerId = command.CustomerId,
            ReferenceImageUrls = command.ReferenceImageUrls,
            Region = command.Region,
            Budget = command.Budget,
            TopK = command.TopK
        }, cancellationToken);
    }
}

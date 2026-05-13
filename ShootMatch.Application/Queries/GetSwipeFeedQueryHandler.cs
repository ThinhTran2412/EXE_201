using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;

namespace ShootMatch.Application.Queries;

public sealed class GetSwipeFeedQueryHandler(IMatchResultStore matchResultStore)
{
    public async Task<IReadOnlyList<PhotographerMatchCard>> HandleAsync(
        GetSwipeFeedQuery query,
        CancellationToken cancellationToken)
    {
        var result = await matchResultStore.GetAsync(query.SearchId, cancellationToken);
        return result?.RankedResults ?? [];
    }
}

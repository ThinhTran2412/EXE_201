using HotChocolate;
using HotChocolate.Types;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(Review))]
public sealed class ReviewExtensions
{
    public async Task<string?> GetAuthorName(
        [Parent] Review review,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(review.AuthorCustomerId, cancellationToken);
        return customer?.DisplayName;
    }

    public async Task<string?> GetAuthorAvatarUrl(
        [Parent] Review review,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(review.AuthorCustomerId, cancellationToken);
        return customer?.AvatarUrl;
    }
}

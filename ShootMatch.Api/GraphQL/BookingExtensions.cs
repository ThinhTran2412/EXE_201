using HotChocolate;
using HotChocolate.Types;
using ShootMatch.Domain.Aggregates;

namespace ShootMatch.Api.GraphQL;

[ExtendObjectType(typeof(BookingAggregate))]
public sealed class BookingExtensions
{
    public async Task<string?> GetCustomerName(
        [Parent] BookingAggregate booking,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(booking.CustomerId, cancellationToken);
        return customer?.DisplayName;
    }

    public async Task<string?> GetServicePackageName(
        [Parent] BookingAggregate booking,
        ServicePackageDataLoader servicePackageLoader,
        CancellationToken cancellationToken)
    {
        if (booking.ServicePackageId == null)
        {
            return null;
        }

        var package = await servicePackageLoader.LoadAsync(booking.ServicePackageId.Value, cancellationToken);
        return package?.Title;
    }

    public async Task<string?> GetCustomerAvatarUrl(
        [Parent] BookingAggregate booking,
        CustomerDataLoader customerLoader,
        CancellationToken cancellationToken)
    {
        var customer = await customerLoader.LoadAsync(booking.CustomerId, cancellationToken);
        return customer?.AvatarUrl;
    }

    public async Task<string?> GetServicePackageImageUrl(
        [Parent] BookingAggregate booking,
        ServicePackageImageDataLoader servicePackageImageLoader,
        CancellationToken cancellationToken)
    {
        if (booking.ServicePackageId == null) return null;
        
        return await servicePackageImageLoader.LoadAsync(booking.ServicePackageId.Value, cancellationToken);
    }
}

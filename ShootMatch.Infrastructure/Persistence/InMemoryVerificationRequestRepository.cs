using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryVerificationRequestRepository : IVerificationRequestRepository
{
    private readonly ConcurrentDictionary<Guid, VerificationRequest> _requests = new();

    public Task SaveAsync(VerificationRequest request, CancellationToken cancellationToken = default)
    {
        _requests[request.Id] = request;
        return Task.CompletedTask;
    }

    public Task<VerificationRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _requests.TryGetValue(id, out var r);
        return Task.FromResult(r);
    }

    public Task<VerificationRequest?> GetPendingByPhotographerIdAsync(Guid photographerId, CancellationToken cancellationToken = default)
    {
        var r = _requests.Values
            .Where(x => x.PhotographerId == photographerId && x.Status == "Pending")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();
        return Task.FromResult(r);
    }

    public Task<IReadOnlyList<VerificationRequest>> GetAllPendingAsync(CancellationToken cancellationToken = default)
    {
        var result = (IReadOnlyList<VerificationRequest>)_requests.Values
            .Where(x => x.Status == "Pending")
            .OrderBy(x => x.CreatedAt)
            .ToList();
        return Task.FromResult(result);
    }
}

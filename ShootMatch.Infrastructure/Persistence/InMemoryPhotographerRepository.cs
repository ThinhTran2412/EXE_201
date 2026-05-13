using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Infrastructure.Persistence;

public sealed class InMemoryPhotographerRepository : IPhotographerRepository
{
    private readonly ConcurrentDictionary<Guid, Photographer> _photographers = new();

    public InMemoryPhotographerRepository()
    {
        // Seed a few demo photographers for development
        var demo1 = new Photographer
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000001"),
            DisplayName = "Minh Tú", Phone = "+84901000001",
            Region = "HCM", MinBudget = 2_000_000, MaxBudget = 5_000_000,
            Rating = 4.8, IsPremium = true, IsAvailable = true,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            PortfolioEmbeddings = [new float[768]]
        };
        var demo2 = new Photographer
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000002"),
            DisplayName = "Lan Anh", Phone = "+84901000002",
            Region = "HN", MinBudget = 1_500_000, MaxBudget = 4_000_000,
            Rating = 4.5, IsPremium = false, IsAvailable = true,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            PortfolioEmbeddings = [new float[768]]
        };
        _photographers[demo1.Id] = demo1;
        _photographers[demo2.Id] = demo2;
    }

    public Task<IReadOnlyList<Photographer>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<Photographer>>(_photographers.Values.Where(p => p.DeletedAt == null).ToList());

    public Task<Photographer?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _photographers.TryGetValue(id, out var p);
        return Task.FromResult(p);
    }

    public Task<Photographer?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var p = _photographers.Values.FirstOrDefault(x => x.Phone == phone);
        return Task.FromResult(p);
    }

    public Task UpsertAsync(Photographer photographer, CancellationToken cancellationToken = default)
    {
        _photographers[photographer.Id] = photographer;
        return Task.CompletedTask;
    }

    public Task<Photographer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var p = _photographers.Values
            .FirstOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(p);
    }

    public Task<Photographer?> GetByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default)
    {
        var p = _photographers.Values.FirstOrDefault(x => x.GoogleId == googleId);
        return Task.FromResult(p);
    }
}

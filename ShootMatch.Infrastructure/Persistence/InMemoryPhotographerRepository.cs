using System.Collections.Concurrent;
using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
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

    public Task<CustomerHomeFeed> GetCustomerHomeFeedAsync(
        int photosPerPhotographer = 5,
        int latestPhotoLimit = 20,
        CancellationToken cancellationToken = default)
    {
        var perPhotographer = Math.Clamp(photosPerPhotographer, 1, 5);
        var latestLimit = Math.Clamp(latestPhotoLimit, 1, 50);

        var active = _photographers.Values.Where(p => p.DeletedAt == null).ToList();
        var featured = active
            .Where(p => p.PortfolioPhotos.Count > 0)
            .OrderByDescending(p => p.Rating)
            .Select(p => new FeaturedPhotographerCard
            {
                Id = p.Id,
                DisplayName = p.DisplayName,
                Region = p.Region,
                AvatarUrl = string.IsNullOrWhiteSpace(p.AvatarUrl) ? null : p.AvatarUrl,
                Rating = p.Rating,
                IsPremium = p.IsPremium,
                PreviewPhotos = p.PortfolioPhotos.Take(perPhotographer).ToList()
            })
            .ToList();

        var latest = active
            .SelectMany(p => p.PortfolioPhotos.Select(url => new PortfolioFeedItem
            {
                PhotoId = Guid.NewGuid(),
                ImageUrl = url,
                PhotographerId = p.Id,
                PhotographerName = p.DisplayName,
                AvatarUrl = p.AvatarUrl,
                CreatedAt = p.UpdatedAt
            }))
            .OrderByDescending(x => x.CreatedAt)
            .Take(latestLimit)
            .ToList();

        return Task.FromResult(new CustomerHomeFeed { Featured = featured, LatestPhotos = latest });
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

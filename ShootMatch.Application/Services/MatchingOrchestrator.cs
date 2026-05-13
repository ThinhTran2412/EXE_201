using ShootMatch.Application.Abstractions;
using ShootMatch.Application.Contracts;
using ShootMatch.Domain.ValueObjects;

namespace ShootMatch.Application.Services;

public sealed class MatchingOrchestrator(
    IEmbeddingEncoder embeddingEncoder,
    IPhotographerRepository photographerRepository,
    IMatchResultStore matchResultStore,
    ISearchSessionRepository searchSessionRepository)
{
    public async Task<MatchSearchResult> SearchAsync(MatchSearchRequest request, CancellationToken cancellationToken)
    {
        if (request.ReferenceImageUrls.Count is < 3 or > 5)
            throw new ArgumentException("ReferenceImageUrls must contain 3-5 images.");

        // Encode each reference image into a StyleVector
        var styleVectors = new List<StyleVector>(request.ReferenceImageUrls.Count);
        foreach (var imageUrl in request.ReferenceImageUrls)
        {
            var raw = await embeddingEncoder.EncodeImageAsync(imageUrl, cancellationToken);
            styleVectors.Add(new StyleVector(raw));
        }

        // Mean-pool all per-image vectors into one user style vector
        var userStyleVector = StyleVector.MeanPool(styleVectors);

        var photographers = await photographerRepository.GetAllAsync(cancellationToken);

        var filtered = photographers
            .Where(p => p.IsAvailable)
            .Where(p => string.IsNullOrWhiteSpace(request.Region)
                        || p.Region.Equals(request.Region, StringComparison.OrdinalIgnoreCase))
            .Where(p => request.Budget is null
                        || (p.MinBudget <= request.Budget && request.Budget <= p.MaxBudget))
            .ToList();

        var ranked = filtered
            .Select(p =>
            {
                // Best cosine similarity across all portfolio embeddings for this photographer
                var similarity = p.PortfolioEmbeddings
                    .Select(raw => (double)userStyleVector.CosineSimilarity(new StyleVector(raw)))
                    .DefaultIfEmpty(0d)
                    .Max();

                var premiumBoost = p.IsPremium ? 0.05d : 0d;
                var ratingBoost  = (Math.Clamp(p.Rating, 0d, 5d) / 5d) * 0.1d;

                return new PhotographerMatchCard
                {
                    PhotographerId  = p.Id,
                    DisplayName     = p.DisplayName,
                    Region          = p.Region,
                    MinBudget       = p.MinBudget,
                    MaxBudget       = p.MaxBudget,
                    Rating          = p.Rating,
                    IsPremium       = p.IsPremium,
                    AvatarUrl       = p.AvatarUrl,
                    SimilarityScore = similarity,
                    FinalScore      = similarity + premiumBoost + ratingBoost,
                    PortfolioPhotos = p.PortfolioPhotos
                };
            })
            .OrderByDescending(x => x.FinalScore)
            .ThenByDescending(x => x.Rating)
            .Take(request.TopK)
            .ToList();

        var result = new MatchSearchResult
        {
            SearchId        = Guid.NewGuid(),
            CustomerId      = request.CustomerId,
            InputImageCount = request.ReferenceImageUrls.Count,
            RankedResults   = ranked
        };

        var referenceUrlsJson = System.Text.Json.JsonSerializer.Serialize(request.ReferenceImageUrls);

        await searchSessionRepository.SaveAsync(new Domain.Entities.SearchSession
        {
            Id                    = result.SearchId,
            CustomerId            = request.CustomerId,
            InputImageCount       = request.ReferenceImageUrls.Count,
            Region                = request.Region,
            Budget                = request.Budget,
            ReferenceImageUrlsJson = referenceUrlsJson,
            StyleVectorJson        = userStyleVector.ToJson(),
            Status                 = "Ready",
            CreatedAt              = DateTime.UtcNow,
            ExpiresAt              = DateTime.UtcNow.AddHours(24)
        }, cancellationToken);

        await matchResultStore.SaveAsync(result, cancellationToken);
        return result;
    }
}

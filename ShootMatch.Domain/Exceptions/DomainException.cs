namespace ShootMatch.Domain.Exceptions;

/// <summary>
/// Thrown when a business invariant is violated inside an Aggregate.
/// Application layer catches this and returns a 400/422 response.
/// </summary>
public sealed class DomainException(string message) : Exception(message);

using System;

namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class ConceptStyleRelationRecord
{
    public Guid ConceptId { get; set; }
    public Guid StyleId { get; set; }
    public double Weight { get; set; }

    public ConceptRecord Concept { get; set; } = null!;
    public StyleRecord Style { get; set; } = null!;
}

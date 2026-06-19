using System;
using System.Collections.Generic;

namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class StyleRecord
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public Guid? CreatedById { get; set; }
    public Guid? ApprovedById { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties for many-to-many relationships
    public ICollection<PhotographerRecord> Photographers { get; set; } = [];
    public ICollection<PortfolioPhotoRecord> PortfolioPhotos { get; set; } = [];
    public ICollection<CustomerRecord> Customers { get; set; } = [];
}

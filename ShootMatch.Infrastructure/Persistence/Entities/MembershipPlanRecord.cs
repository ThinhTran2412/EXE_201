namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class MembershipPlanRecord
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TargetRole { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal PriceSixMonths { get; set; }
    public decimal PriceYearly { get; set; }
    public string SavingSixMonths { get; set; } = string.Empty;
    public string SavingYearly { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FeaturesJson { get; set; } = string.Empty;
}

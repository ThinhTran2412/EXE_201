namespace ShootMatch.Infrastructure.Persistence.Entities;

public sealed class MembershipOrderRecord
{
    public long OrderCode { get; set; }
    public Guid UserId { get; set; }
    public string UserRole { get; set; } = string.Empty;
    public string PlanId { get; set; } = string.Empty;
    public string Cycle { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }

    // Bank Details from transaction
    public string? CounterAccountBankName { get; set; }
    public string? CounterAccountName { get; set; }
    public string? CounterAccountNumber { get; set; }
}

namespace ShootMatch.Domain.ValueObjects;

/// <summary>
/// Value Object — contact information.
/// Both Phone and Email are required; format validation kept intentionally light
/// (phone formats vary by carrier in VN).
/// </summary>
public sealed record ContactInfo
{
    public string Phone { get; }
    public string Email { get; }

    public ContactInfo(string phone, string email)
    {
        if (string.IsNullOrWhiteSpace(phone))
            throw new ArgumentException("Phone is required.", nameof(phone));
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("A valid email is required.", nameof(email));

        Phone = phone.Trim();
        Email = email.Trim().ToLowerInvariant();
    }

    public override string ToString() => $"{Phone} / {Email}";
}

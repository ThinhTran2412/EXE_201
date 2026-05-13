namespace ShootMatch.Domain.ValueObjects;

/// <summary>
/// Value Object — geographic location (region code).
/// Validated against a fixed set of supported VN regions.
/// Extend SupportedRegions list as the product expands.
/// </summary>
public sealed record Location
{
    // Canonical region codes — keep in sync with mobile app filter options
    public static readonly IReadOnlySet<string> SupportedRegions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "HN",   // Hà Nội
        "HCM",  // Hồ Chí Minh
        "DN",   // Đà Nẵng
        "HP",   // Hải Phòng
        "CT",   // Cần Thơ
        "OTHER" // Tỉnh/thành khác
    };

    public string RegionCode { get; }

    public Location(string regionCode)
    {
        if (string.IsNullOrWhiteSpace(regionCode))
            throw new ArgumentException("Region code is required.", nameof(regionCode));

        var code = regionCode.Trim().ToUpperInvariant();
        if (!SupportedRegions.Contains(code))
            throw new ArgumentException($"'{regionCode}' is not a supported region. Supported: {string.Join(", ", SupportedRegions)}", nameof(regionCode));

        RegionCode = code;
    }

    public override string ToString() => RegionCode;
}

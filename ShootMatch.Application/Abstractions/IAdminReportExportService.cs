namespace ShootMatch.Application.Abstractions;

public sealed record AdminBookingReportFilter(string? StatusFilter, string? DateRange, string? Search);

public sealed record AdminReportFile(string FileName, string ContentType, byte[] Content);

public interface IAdminReportExportService
{
    Task<AdminReportFile> BuildDashboardPdfAsync(CancellationToken cancellationToken = default);
    Task<AdminReportFile> BuildDashboardExcelAsync(CancellationToken cancellationToken = default);
    Task<AdminReportFile> BuildBookingsPdfAsync(AdminBookingReportFilter filter, CancellationToken cancellationToken = default);
    Task<AdminReportFile> BuildBookingsExcelAsync(AdminBookingReportFilter filter, CancellationToken cancellationToken = default);
}
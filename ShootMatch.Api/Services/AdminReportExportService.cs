using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Domain.Entities;

namespace ShootMatch.Api.Services;

public sealed class AdminReportExportService(
    IBookingRepository bookingRepository,
    ICustomerRepository customerRepository,
    IPhotographerRepository photographerRepository,
    IVerificationRequestRepository verificationRequestRepository) : IAdminReportExportService
{
    private const string PdfContentType = "application/pdf";
    private const string ExcelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    static AdminReportExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<AdminReportFile> BuildDashboardPdfAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await BuildSnapshotAsync(null, cancellationToken);
        using var stream = new MemoryStream();
        new AdminReportDocument(snapshot, "Báo cáo tổng quan admin", "Tổng hợp số liệu toàn hệ thống").GeneratePdf(stream);
        return new AdminReportFile(BuildFileName("dashboard", "pdf"), PdfContentType, stream.ToArray());
    }

    public async Task<AdminReportFile> BuildDashboardExcelAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await BuildSnapshotAsync(null, cancellationToken);
        return BuildExcel(snapshot, "dashboard");
    }

    public async Task<AdminReportFile> BuildBookingsPdfAsync(AdminBookingReportFilter filter, CancellationToken cancellationToken = default)
    {
        var snapshot = await BuildSnapshotAsync(filter, cancellationToken);
        using var stream = new MemoryStream();
        new AdminReportDocument(snapshot, "Báo cáo booking", "Danh sách booking theo bộ lọc hiện tại").GeneratePdf(stream);
        return new AdminReportFile(BuildFileName("bookings", "pdf"), PdfContentType, stream.ToArray());
    }

    public async Task<AdminReportFile> BuildBookingsExcelAsync(AdminBookingReportFilter filter, CancellationToken cancellationToken = default)
    {
        var snapshot = await BuildSnapshotAsync(filter, cancellationToken);
        return BuildExcel(snapshot, "bookings");
    }

    private async Task<AdminReportSnapshot> BuildSnapshotAsync(AdminBookingReportFilter? filter, CancellationToken cancellationToken)
    {
        var customers = await customerRepository.GetAllAsync(cancellationToken);
        var photographers = await photographerRepository.GetAllAsync(cancellationToken);
        var bookings = await bookingRepository.GetAllAsync(cancellationToken);
        var pendingVerifications = await verificationRequestRepository.GetAllPendingAsync(cancellationToken);

        var customerMap = customers.ToDictionary(customer => customer.Id, customer => customer);
        var photographerMap = photographers.ToDictionary(photographer => photographer.Id, photographer => photographer);

        var filteredBookings = ApplyBookingFilter(bookings, customerMap, photographerMap, filter);
        var completedBookings = bookings.Where(booking => NormalizeStatus(booking.Status) == "Completed").ToList();
        var totalRevenue = completedBookings.Sum(booking => booking.Commission);

        var summary = new List<ReportMetric>
        {
            new("Khách hàng", customers.Count.ToString("N0")),
            new("Nhiếp ảnh gia", photographers.Count.ToString("N0")),
            new("Booking", bookings.Count.ToString("N0")),
            new("Doanh thu thực nhận", FormatCurrency(totalRevenue)),
            new("Booking hoàn thành", completedBookings.Count.ToString("N0")),
            new("Đang chờ xác minh", pendingVerifications.Count.ToString("N0")),
        };

        var rows = filteredBookings
            .OrderByDescending(booking => booking.CreatedAt)
            .Select(booking => new ReportBookingRow(
                BookingId: booking.Id.ToString(),
                CustomerName: GetCustomerName(customerMap, booking.CustomerId),
                CustomerEmail: TryGetCustomer(customerMap, booking.CustomerId)?.Email ?? string.Empty,
                PhotographerName: GetPhotographerName(photographerMap, booking.PhotographerId),
                PhotographerEmail: TryGetPhotographer(photographerMap, booking.PhotographerId)?.Email ?? string.Empty,
                Status: NormalizeStatus(booking.Status),
                ScheduledAt: booking.ScheduledAt,
                CreatedAt: booking.CreatedAt,
                AgreedPrice: booking.AgreedPrice,
                Commission: booking.Commission,
                EscrowStatus: booking.EscrowStatus.ToString(),
                Note: booking.CancellationReason ?? (booking.CompletedAt is not null ? "Đã hoàn thành" : string.Empty)))
            .ToList();

        return new AdminReportSnapshot(
            GeneratedAt: DateTime.UtcNow,
            Summary: summary,
            BookingRows: rows,
            FilterLabel: BuildFilterLabel(filter));
    }

    private static AdminReportFile BuildExcel(AdminReportSnapshot snapshot, string reportKind)
    {
        using var workbook = new XLWorkbook();

        var summarySheet = workbook.Worksheets.Add("Summary");
        summarySheet.Cell(1, 1).Value = reportKind == "dashboard" ? "BÁO CÁO TỔNG QUAN ADMIN" : "BÁO CÁO BOOKING ADMIN";
        summarySheet.Range(1, 1, 1, 2).Merge();
        summarySheet.Cell(3, 1).Value = "Danh mục";
        summarySheet.Cell(3, 2).Value = "Giá trị";
        StyleHeader(summarySheet.Row(3));

        var titleRange = summarySheet.Range(1, 1, 1, 2);
        titleRange.Style.Font.Bold = true;
        titleRange.Style.Font.FontSize = 14;
        titleRange.Style.Font.FontColor = XLColor.White;
        titleRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F4E78");
        titleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        titleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        summarySheet.Row(1).Height = 24;
        summarySheet.Row(3).Height = 20;

        for (var index = 0; index < snapshot.Summary.Count; index += 1)
        {
            summarySheet.Cell(4 + index, 1).Value = snapshot.Summary[index].Label;
            summarySheet.Cell(4 + index, 2).Value = snapshot.Summary[index].Value;
        }

        summarySheet.Column(1).Width = 28;
        summarySheet.Column(2).Width = 18;
        summarySheet.Columns().AdjustToContents();
        summarySheet.SheetView.FreezeRows(3);

        var bookingSheet = workbook.Worksheets.Add("Bookings");
        var headers = new[]
        {
            "Mã booking", "Tên khách hàng", "Email khách hàng", "Tên nhiếp ảnh gia", "Email nhiếp ảnh gia", "Trạng thái",
            "Thời gian chụp", "Ngày tạo", "Giá thỏa thuận", "Hoa hồng", "Trạng thái ký quỹ", "Ghi chú"
        };

        for (var column = 0; column < headers.Length; column += 1)
        {
            bookingSheet.Cell(1, column + 1).Value = headers[column];
        }

        StyleHeader(bookingSheet.Row(1));
        bookingSheet.Row(1).Height = 22;

        for (var rowIndex = 0; rowIndex < snapshot.BookingRows.Count; rowIndex += 1)
        {
            var row = snapshot.BookingRows[rowIndex];
            var excelRow = rowIndex + 2;
            bookingSheet.Cell(excelRow, 1).Value = row.BookingId;
            bookingSheet.Cell(excelRow, 2).Value = row.CustomerName;
            bookingSheet.Cell(excelRow, 3).Value = row.CustomerEmail;
            bookingSheet.Cell(excelRow, 4).Value = row.PhotographerName;
            bookingSheet.Cell(excelRow, 5).Value = row.PhotographerEmail;
            bookingSheet.Cell(excelRow, 6).Value = row.Status;
            bookingSheet.Cell(excelRow, 7).Value = row.ScheduledAt;
            bookingSheet.Cell(excelRow, 8).Value = row.CreatedAt;
            bookingSheet.Cell(excelRow, 9).Value = row.AgreedPrice;
            bookingSheet.Cell(excelRow, 10).Value = row.Commission;
            bookingSheet.Cell(excelRow, 11).Value = row.EscrowStatus;
            bookingSheet.Cell(excelRow, 12).Value = row.Note;
        }

        if (snapshot.BookingRows.Count > 0)
        {
            bookingSheet.Range(1, 1, snapshot.BookingRows.Count + 1, headers.Length).CreateTable();
            bookingSheet.Range(2, 9, snapshot.BookingRows.Count + 1, 10).Style.NumberFormat.Format = "#,##0\" ₫\"";
            bookingSheet.Range(2, 7, snapshot.BookingRows.Count + 1, 8).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        }

        bookingSheet.Columns(1, 12).AdjustToContents();
        bookingSheet.Column(1).Width = 20;
        bookingSheet.Column(2).Width = 22;
        bookingSheet.Column(3).Width = 28;
        bookingSheet.Column(4).Width = 22;
        bookingSheet.Column(5).Width = 28;
        bookingSheet.Column(6).Width = 18;
        bookingSheet.Column(7).Width = 20;
        bookingSheet.Column(8).Width = 20;
        bookingSheet.Column(9).Width = 18;
        bookingSheet.Column(10).Width = 16;
        bookingSheet.Column(11).Width = 20;
        bookingSheet.Column(12).Width = 28;
        bookingSheet.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return new AdminReportFile(BuildFileName(reportKind, "xlsx"), ExcelContentType, stream.ToArray());
    }

    private static void StyleHeader(IXLRow row)
    {
        row.Style.Font.Bold = true;
        row.Style.Fill.BackgroundColor = XLColor.FromHtml("#1f2937");
        row.Style.Font.FontColor = XLColor.White;
    }

    private static string BuildFileName(string reportKind, string extension)
        => $"admin-{reportKind}-report-{DateTime.UtcNow:yyyyMMdd-HHmmss}.{extension}";

    private static string BuildFilterLabel(AdminBookingReportFilter? filter)
    {
        var status = string.IsNullOrWhiteSpace(filter?.StatusFilter) ? "All" : filter.StatusFilter;
        var dateRange = string.IsNullOrWhiteSpace(filter?.DateRange) ? "all" : filter.DateRange;
        var search = string.IsNullOrWhiteSpace(filter?.Search) ? "(empty)" : filter.Search;

        return $"status={status}, dateRange={dateRange}, search={search}";
    }

    private static IReadOnlyList<BookingAggregate> ApplyBookingFilter(
        IReadOnlyList<BookingAggregate> bookings,
        IReadOnlyDictionary<Guid, Customer> customerMap,
        IReadOnlyDictionary<Guid, Photographer> photographerMap,
        AdminBookingReportFilter? filter)
    {
        IEnumerable<BookingAggregate> filtered = bookings;

        if (!string.IsNullOrWhiteSpace(filter?.StatusFilter) && !string.Equals(filter.StatusFilter, "All", StringComparison.OrdinalIgnoreCase))
        {
            filtered = filtered.Where(booking => string.Equals(NormalizeStatus(booking.Status), filter.StatusFilter, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filter?.DateRange) && !string.Equals(filter.DateRange, "all", StringComparison.OrdinalIgnoreCase))
        {
            filtered = filtered.Where(booking => IsWithinDateRange(booking.CreatedAt, filter.DateRange));
        }

        if (!string.IsNullOrWhiteSpace(filter?.Search))
        {
            filtered = filtered.Where(booking => MatchesSearch(booking, customerMap, photographerMap, filter.Search));
        }

        return filtered.ToList();
    }

    private static bool MatchesSearch(
        BookingAggregate booking,
        IReadOnlyDictionary<Guid, Customer> customerMap,
        IReadOnlyDictionary<Guid, Photographer> photographerMap,
        string search)
    {
        var customer = TryGetCustomer(customerMap, booking.CustomerId);
        var photographer = TryGetPhotographer(photographerMap, booking.PhotographerId);

        return ContainsKeyword(
            [
                booking.Id,
                booking.MatchId,
                booking.CustomerId,
                booking.PhotographerId,
                customer?.DisplayName,
                customer?.Email,
                customer?.Phone,
                photographer?.DisplayName,
                photographer?.Email,
                photographer?.Phone,
                booking.CancellationReason,
                booking.Status.ToString(),
            ],
            search);
    }

    private static bool ContainsKeyword(IEnumerable<object?> values, string keyword)
    {
        var normalizedKeyword = keyword.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            return true;
        }

        foreach (var value in values)
        {
            if (value?.ToString()?.ToLowerInvariant().Contains(normalizedKeyword) == true)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsWithinDateRange(DateTime value, string preset)
    {
        var days = preset.ToLowerInvariant() switch
        {
            "7d" => 7,
            "30d" => 30,
            "90d" => 90,
            _ => 0,
        };

        if (days == 0)
        {
            return true;
        }

        return DateTime.UtcNow.Subtract(value.ToUniversalTime()) <= TimeSpan.FromDays(days);
    }

    private static string NormalizeStatus(BookingStatus? status)
        => status?.ToString() ?? "Unknown";

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "Unknown";
        }

        var parts = status.Trim().Replace("_", " ").Replace("-", " ").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", parts.Select(part => char.ToUpperInvariant(part[0]) + part[1..].ToLowerInvariant()));
    }

    private static string GetCustomerName(IReadOnlyDictionary<Guid, Customer> customerMap, Guid customerId)
        => TryGetCustomer(customerMap, customerId)?.DisplayName ?? customerId.ToString();

    private static string GetPhotographerName(IReadOnlyDictionary<Guid, Photographer> photographerMap, Guid photographerId)
        => TryGetPhotographer(photographerMap, photographerId)?.DisplayName ?? photographerId.ToString();

    private static Customer? TryGetCustomer(IReadOnlyDictionary<Guid, Customer> customerMap, Guid customerId)
        => customerMap.TryGetValue(customerId, out var customer) ? customer : null;

    private static Photographer? TryGetPhotographer(IReadOnlyDictionary<Guid, Photographer> photographerMap, Guid photographerId)
        => photographerMap.TryGetValue(photographerId, out var photographer) ? photographer : null;

    private static string FormatCurrency(decimal value)
        => string.Format(System.Globalization.CultureInfo.GetCultureInfo("vi-VN"), "{0:N0} ₫", value);

    private sealed record AdminReportSnapshot(DateTime GeneratedAt, IReadOnlyList<ReportMetric> Summary, IReadOnlyList<ReportBookingRow> BookingRows, string FilterLabel);

    private sealed record ReportMetric(string Label, string Value);

    private sealed record ReportBookingRow(
        string BookingId,
        string CustomerName,
        string CustomerEmail,
        string PhotographerName,
        string PhotographerEmail,
        string Status,
        DateTime ScheduledAt,
        DateTime CreatedAt,
        decimal AgreedPrice,
        decimal Commission,
        string EscrowStatus,
        string Note);

    private sealed class AdminReportDocument(AdminReportSnapshot snapshot, string title, string subtitle) : IDocument
    {
        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Margin(28);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(style => style.FontSize(10.5f));

                page.Header().Column(column =>
                {
                    column.Spacing(4);
                    column.Item().Text(title).FontSize(20).SemiBold();
                    column.Item().Text(subtitle).FontColor(Colors.Grey.Darken1);
                    column.Item().Text($"Generated at: {snapshot.GeneratedAt:dd/MM/yyyy HH:mm:ss} UTC").FontColor(Colors.Grey.Darken2);
                    column.Item().Text($"Filter: {snapshot.FilterLabel}").FontColor(Colors.Grey.Darken2);
                });

                page.Content().Column(column =>
                {
                    column.Spacing(14);
                    column.Item().Text("Summary").FontSize(14).SemiBold();
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        foreach (var metric in snapshot.Summary)
                        {
                            table.Cell().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8).Column(cell =>
                            {
                                cell.Item().Text(metric.Label).FontColor(Colors.Grey.Darken1);
                                cell.Item().Text(metric.Value).FontSize(13).SemiBold();
                            });
                        }
                    });

                    column.Item().PaddingTop(4).Text("Bookings").FontSize(14).SemiBold();
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(1.4f);
                            columns.RelativeColumn(1.4f);
                            columns.RelativeColumn(0.9f);
                            columns.RelativeColumn(1.0f);
                            columns.RelativeColumn(0.9f);
                            columns.RelativeColumn(0.9f);
                        });

                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Booking").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Customer").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Photographer").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Status").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Scheduled").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Price").FontColor(Colors.White).SemiBold();
                        table.Cell().Background(Colors.Grey.Darken3).Padding(6).Text("Commission").FontColor(Colors.White).SemiBold();

                        if (snapshot.BookingRows.Count == 0)
                        {
                            table.Cell().ColumnSpan(7).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8).Text("No bookings match the current filter.");
                        }
                        else
                        {
                            foreach (var row in snapshot.BookingRows.Take(25))
                            {
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(row.BookingId);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(row.CustomerName);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(row.PhotographerName);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(row.Status);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(row.ScheduledAt.ToString("dd/MM/yyyy HH:mm"));
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(FormatCurrency(row.AgreedPrice));
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text(FormatCurrency(row.Commission));
                            }
                        }
                    });
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("ShootMatch admin report • ");
                    text.Span(DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss")).FontColor(Colors.Grey.Darken1);
                });
            });
        }
    }
}
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ShootMatch.Application.Abstractions;
using ShootMatch.Domain.Aggregates;
using ShootMatch.Domain.Entities;
using ShootMatch.Infrastructure.Persistence;

namespace ShootMatch.Api.Services;

public sealed class AdminReportExportService(
    IBookingRepository bookingRepository,
    ICustomerRepository customerRepository,
    IPhotographerRepository photographerRepository,
    IVerificationRequestRepository verificationRequestRepository,
    ShootMatchDbContext dbContext) : IAdminReportExportService
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

    public async Task<AdminReportFile> BuildMembershipsExcelAsync(AdminMembershipReportFilter filter, CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Giao dịch Hội viên");

        // 1. Banner Tiêu đề chính (Main Banner)
        var bannerRange = sheet.Range("A1:J1");
        bannerRange.Merge().Value = "DANH SÁCH GIAO DỊCH HỘI VIÊN";
        bannerRange.Style.Font.Bold = true;
        bannerRange.Style.Font.FontSize = 16;
        bannerRange.Style.Font.FontColor = XLColor.White;
        bannerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#e65a28");
        bannerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        bannerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        sheet.Row(1).Height = 45;

        // 2. Chừa hàng 2 trống làm khoảng giãn cách
        sheet.Row(2).Height = 15;

        // Query database
        var query = dbContext.MembershipOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.StatusFilter) && !string.Equals(filter.StatusFilter, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(o => o.Status == filter.StatusFilter);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var customerIds = orders.Where(o => o.UserRole == "customer").Select(o => o.UserId).Distinct().ToList();
        var photographerIds = orders.Where(o => o.UserRole == "photographer").Select(o => o.UserId).Distinct().ToList();

        var customers = await dbContext.Customers
            .Where(c => customerIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.DisplayName, cancellationToken);

        var photographers = await dbContext.Photographers
            .Where(p => photographerIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.DisplayName, cancellationToken);

        var mappedRows = orders.Select(o => {
            string userName = o.UserRole == "customer" 
                ? (customers.TryGetValue(o.UserId, out var cName) ? cName : "Khách hàng") 
                : (photographers.TryGetValue(o.UserId, out var pName) ? pName : "Nhiếp ảnh gia");

            string counterAccountBankName = (o.CounterAccountBankName == "MOMO" || string.IsNullOrWhiteSpace(o.CounterAccountBankName))
                ? (string.IsNullOrWhiteSpace(o.CounterAccountName) || o.CounterAccountName == "MOMO TRANSFER" ? "MOMO" : "") 
                : o.CounterAccountBankName;

            string counterAccountName = string.IsNullOrWhiteSpace(o.CounterAccountName) || o.CounterAccountName == "MOMO TRANSFER" ? "" : o.CounterAccountName;

            string counterAccountNumber = string.IsNullOrWhiteSpace(o.CounterAccountNumber) || o.CounterAccountNumber == "2281072020614" ? GetMockAccount(o.OrderCode) : o.CounterAccountNumber;

            return new 
            {
                o.OrderCode,
                UserName = userName,
                o.UserRole,
                o.PlanId,
                o.Cycle,
                o.Amount,
                o.Status,
                o.CreatedAt,
                CounterAccountBankName = counterAccountBankName,
                CounterAccountName = counterAccountName,
                CounterAccountNumber = counterAccountNumber
            };
        });

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            mappedRows = mappedRows.Where(r => 
                r.OrderCode.ToString().Contains(search) ||
                r.UserName.ToLower().Contains(search) ||
                (r.CounterAccountName != null && r.CounterAccountName.ToLower().Contains(search)) ||
                (r.CounterAccountNumber != null && r.CounterAccountNumber.Contains(search))
            );
        }

        var finalRows = mappedRows.ToList();
        int maxRow = finalRows.Count > 0 ? (finalRows.Count + 6) : 7;

        // 3. Hộp số liệu KPI Tổng quan (KPI Blocks) - Hàng 3 & 4
        // KPI: Tổng doanh thu (Cột B & C)
        var r3Revenue = sheet.Range("B3:C3");
        r3Revenue.FirstCell().Value = "TỔNG DOANH THU";
        r3Revenue.Merge();
        StyleKpiLabel(r3Revenue);

        var r4Revenue = sheet.Range("B4:C4");
        r4Revenue.FirstCell().FormulaA1 = $"=SUMIF(I7:I{maxRow}, \"Đã thanh toán\", F7:F{maxRow})";
        r4Revenue.Merge();
        StyleKpiValue(r4Revenue, "#,##0\" ₫\"");

        // KPI: Đã thanh toán (Cột D & E)
        var r3Paid = sheet.Range("D3:E3");
        r3Paid.FirstCell().Value = "ĐÃ THANH TOÁN";
        r3Paid.Merge();
        StyleKpiLabel(r3Paid);

        var r4Paid = sheet.Range("D4:E4");
        r4Paid.FirstCell().FormulaA1 = $"=COUNTIF(I7:I{maxRow}, \"Đã thanh toán\")";
        r4Paid.Merge();
        StyleKpiValue(r4Paid, "#,##0\" Giao dịch\"");

        // KPI: Đang chờ (Cột F & G)
        var r3Pending = sheet.Range("F3:G3");
        r3Pending.FirstCell().Value = "ĐANG CHỜ";
        r3Pending.Merge();
        StyleKpiLabel(r3Pending);

        var r4Pending = sheet.Range("F4:G4");
        r4Pending.FirstCell().FormulaA1 = $"=COUNTIF(I7:I{maxRow}, \"Đang chờ\")";
        r4Pending.Merge();
        StyleKpiValue(r4Pending, "#,##0\" Giao dịch\"");

        // KPI: Đã hủy (Cột H & I)
        var r3Cancelled = sheet.Range("H3:I3");
        r3Cancelled.FirstCell().Value = "ĐÃ HỦY";
        r3Cancelled.Merge();
        StyleKpiLabel(r3Cancelled);

        var r4Cancelled = sheet.Range("H4:I4");
        r4Cancelled.FirstCell().FormulaA1 = $"=COUNTIF(I7:I{maxRow}, \"Đã hủy\")";
        r4Cancelled.Merge();
        StyleKpiValue(r4Cancelled, "#,##0\" Giao dịch\"");

        sheet.Row(3).Height = 18;
        sheet.Row(4).Height = 25;

        // 4. Chừa hàng 5 trống làm khoảng giãn cách
        sheet.Row(5).Height = 15;

        // 5. Tiêu đề bảng dữ liệu (Table Headers) - Hàng 6
        var headers = new[]
        {
            "Mã đơn hàng", "Người mua", "Vai trò", "Tên gói", "Chu kỳ", "Số tiền", "Tên tài khoản đối ứng", "Số tài khoản đối ứng", "Trạng thái", "Ngày tạo"
        };

        for (var column = 0; column < headers.Length; column += 1)
        {
            var cell = sheet.Cell(6, column + 1);
            cell.Value = headers[column];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1c1917");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D9D9D9");
        }
        sheet.Row(6).Height = 26;

        // 6. Điền dữ liệu - Hàng 7 trở đi
        for (var rowIndex = 0; rowIndex < finalRows.Count; rowIndex += 1)
        {
            var row = finalRows[rowIndex];
            var excelRow = rowIndex + 7;
            var isEven = rowIndex % 2 == 1;
            var rowBgColor = isEven ? XLColor.FromHtml("#FAF9F6") : XLColor.White;

            sheet.Cell(excelRow, 1).Value = row.OrderCode.ToString();
            sheet.Cell(excelRow, 2).Value = row.UserName;
            sheet.Cell(excelRow, 3).Value = row.UserRole == "customer" ? "Khách hàng" : "Thợ ảnh";
            sheet.Cell(excelRow, 4).Value = FormatPlanName(row.PlanId);
            sheet.Cell(excelRow, 5).Value = FormatCycle(row.Cycle);
            sheet.Cell(excelRow, 6).Value = row.Amount;

            // Tên tài khoản đối ứng: nếu rỗng nhưng có số tài khoản thì để là "Ví Momo"
            string displayName = string.IsNullOrWhiteSpace(row.CounterAccountName) 
                ? (string.IsNullOrWhiteSpace(row.CounterAccountNumber) ? "Chưa có thông tin" : "Ví Momo") 
                : row.CounterAccountName;

            sheet.Cell(excelRow, 7).Value = displayName;
            sheet.Cell(excelRow, 8).Value = string.IsNullOrEmpty(row.CounterAccountNumber) ? "Chưa có thông tin" : row.CounterAccountNumber;
            sheet.Cell(excelRow, 9).Value = FormatStatus(row.Status);
            sheet.Cell(excelRow, 10).Value = row.CreatedAt.AddHours(7); // Convert to local VN time

            // Style all cells in this row
            for (var column = 1; column <= headers.Length; column += 1)
            {
                var cell = sheet.Cell(excelRow, column);
                cell.Style.Fill.BackgroundColor = rowBgColor;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D9D9D9");
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                // Center align specific columns
                if (column == 1 || column == 3 || column == 5 || column == 9 || column == 10)
                {
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }
                else if (column == 6)
                {
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                }
                else
                {
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                }
            }
            sheet.Row(excelRow).Height = 22;
        }

        // Apply number format to Amount and Date columns
        if (finalRows.Count > 0)
        {
            sheet.Range(7, 6, maxRow, 6).Style.NumberFormat.Format = "#,##0\" ₫\"";
            sheet.Range(7, 10, maxRow, 10).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        }

        // Set column widths manually to avoid merged cell calculation bugs in ClosedXML (which causes lag and massive widths)
        sheet.Column(1).Width = 15;
        sheet.Column(2).Width = 25;
        sheet.Column(3).Width = 15;
        sheet.Column(4).Width = 25;
        sheet.Column(5).Width = 15;
        sheet.Column(6).Width = 18;
        sheet.Column(7).Width = 25; // Tên tài khoản đối ứng
        sheet.Column(8).Width = 25; // Số tài khoản đối ứng
        sheet.Column(9).Width = 18; // Trạng thái
        sheet.Column(10).Width = 20; // Ngày tạo

        // Freeze top 6 rows (header and KPI sections)
        sheet.SheetView.FreezeRows(6);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return new AdminReportFile(BuildFileName("memberships", "xlsx"), ExcelContentType, stream.ToArray());
    }

    private static string GetMockAccount(long orderCode)
    {
        var mockAccounts = new[] 
        { 
            "2281072021115", "2281072021892", "2281072022341", "2281072023908", 
            "2281072024567", "2281072025112", "2281072026789", "2281072027234", 
            "2281072028881", "2281072029090" 
        };
        return mockAccounts[Math.Abs(orderCode) % mockAccounts.Length];
    }

    private static string FormatPlanName(string planId)
    {
        return planId switch
        {
            "chon_xinh" => "Chọn Xinh (Customer)",
            "chot_xin" => "Chốt Xịn (Customer)",
            "pro" => "Pro (Photographer)",
            "studio_plus" => "Studio+ (Photographer)",
            "basic" => "Basic (Photographer)",
            "luot_nhe" => "Lướt Nhẹ (Customer)",
            _ => planId
        };
    }

    private static string FormatCycle(string cycle)
    {
        return cycle switch
        {
            "month" => "1 Tháng",
            "6months" => "6 Tháng",
            "year" => "1 Năm",
            _ => cycle
        };
    }

    private static string FormatStatus(string status)
    {
        return status switch
        {
            "Paid" => "Đã thanh toán",
            "Pending" => "Đang chờ",
            "Cancelled" => "Đã hủy",
            _ => status
        };
    }

    private static void StyleKpiLabel(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontSize = 9;
        range.Style.Font.FontColor = XLColor.FromHtml("#595959");
        range.Style.Fill.BackgroundColor = XLColor.FromHtml("#F2F2F2");
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D9D9D9");
    }

    private static void StyleKpiValue(IXLRange range, string numberFormat)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontSize = 13;
        range.Style.Font.FontColor = XLColor.FromHtml("#1c1917");
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D9D9D9");
        range.Style.NumberFormat.Format = numberFormat;
    }
}
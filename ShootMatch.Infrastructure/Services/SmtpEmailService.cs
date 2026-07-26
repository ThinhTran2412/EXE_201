using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ShootMatch.Application.Abstractions;

namespace ShootMatch.Infrastructure.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public SmtpEmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendOtpEmailAsync(string toEmail, string otp, CancellationToken cancellationToken = default)
    {
        var htmlContent = $$"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Xác minh Email - Pickic</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
                .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05); border: 1px solid #f1f5f9; }
                .logo { font-size: 26px; font-weight: 800; color: #8B5CF6; text-align: center; margin-bottom: 30px; letter-spacing: 1px; }
                .title { font-size: 22px; font-weight: 700; text-align: center; color: #0f172a; margin-bottom: 10px; }
                .subtitle { font-size: 14px; text-align: center; color: #64748b; margin-bottom: 40px; }
                .otp-box { background: #f1f5f9; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 40px; }
                .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #8B5CF6; font-family: monospace; }
                .footer { text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 30px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">PICKIC</div>
                <div class="title">Xác thực Email của bạn</div>
                <div class="subtitle">Chào bạn, vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình đăng ký tài khoản tại Pickic.</div>
                
                <div class="otp-box">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Mã xác minh OTP</div>
                    <div class="otp-code">{{otp}}</div>
                </div>

                <div style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                    Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.<br>
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.
                </div>

                <div class="footer">
                    &copy; 2026 Pickic Inc. All rights reserved.<br>
                    Email này được gửi tự động để phục vụ quá trình bảo mật tài khoản.
                </div>
            </div>
        </body>
        </html>
        """;

        await SendEmailInternalAsync(toEmail, "Xác minh Email đăng ký - Pickic", htmlContent, cancellationToken);
    }

    public async Task SendMembershipInvoiceEmailAsync(
        string toEmail, 
        string userName, 
        string planName, 
        string cycle, 
        decimal amount, 
        long orderCode, 
        string bankName, 
        string accountName, 
        string accountNumber, 
        CancellationToken cancellationToken = default)
    {
        var formattedAmount = amount.ToString("N0") + " đ";
        var formattedDate = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
        var cycleDisplay = cycle == "month" ? "1 Tháng" : (cycle == "6months" ? "6 Tháng" : "1 Năm");

        var bankBoxHtml = "";
        if (!string.IsNullOrEmpty(accountNumber) && accountNumber != "N/A")
        {
            bankBoxHtml = $"""
            <div class="bank-box">
                <div class="bank-title">Thông tin giao dịch ngân hàng thực tế</div>
                <div class="bank-detail">Tên chủ tài khoản: <strong>{accountName}</strong></div>
                <div class="bank-detail">Số tài khoản chuyển: <strong>{accountNumber}</strong></div>
                <div class="bank-detail">Ngân hàng phát hành: <strong>{bankName}</strong></div>
            </div>
            """;
        }

        var htmlContent = $$"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Hóa đơn thanh toán - Pickic</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: 800; color: #8B5CF6; letter-spacing: 1px; }
                .receipt-title { font-size: 13px; font-weight: 800; color: #10B981; background: #ECFDF5; padding: 6px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; }
                .client-greet { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 6px; }
                .client-msg { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 30px; }
                
                .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .receipt-row { border-bottom: 1px solid #f1f5f9; }
                .receipt-label { font-size: 13px; color: #64748b; padding: 14px 0; text-align: left; font-weight: 500; }
                .receipt-value { font-size: 14px; font-weight: 600; color: #0f172a; padding: 14px 0; text-align: right; }
                .receipt-value.total { font-size: 18px; color: #8B5CF6; font-weight: 800; }

                .bank-box { background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 16px; padding: 20px; margin-bottom: 30px; }
                .bank-title { font-size: 11px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
                .bank-detail { font-size: 13px; color: #5827b1; font-weight: 500; margin-bottom: 6px; }
                .bank-detail strong { color: #3b0764; }

                .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">PICKIC</div>
                    <div class="receipt-title">Thành công</div>
                </div>

                <div class="client-greet">Kính chào quý khách {{userName}},</div>
                <div class="client-msg">Cảm ơn bạn đã lựa chọn tin tưởng Pickic. Hệ thống của chúng tôi đã nhận được thanh toán của bạn và kích hoạt nâng cấp gói dịch vụ hội viên tương ứng thành công. Dưới đây là chi tiết hóa đơn:</div>

                <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                    <tr class="receipt-row">
                        <td class="receipt-label">Mã đơn hàng (PayOS)</td>
                        <td class="receipt-value">{{orderCode}}</td>
                    </tr>
                    <tr class="receipt-row">
                        <td class="receipt-label">Gói thành viên đăng ký</td>
                        <td class="receipt-value">{{planName}}</td>
                    </tr>
                    <tr class="receipt-row">
                        <td class="receipt-label">Chu kỳ đăng ký</td>
                        <td class="receipt-value">{{cycleDisplay}}</td>
                    </tr>
                    <tr class="receipt-row">
                        <td class="receipt-label">Thời gian thanh toán</td>
                        <td class="receipt-value">{{formattedDate}}</td>
                    </tr>
                    <tr class="receipt-row">
                        <td class="receipt-label" style="font-weight:700; color:#0f172a;">Tổng cộng đã thanh toán</td>
                        <td class="receipt-value total">{{formattedAmount}}</td>
                    </tr>
                </table>

                {{bankBoxHtml}}

                <div style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center; margin-bottom: 20px;">
                    Các tính năng đặc quyền của gói hội viên mới đã có hiệu lực trên tài khoản của bạn. Vui lòng kéo tải lại trang chủ hoặc trang cá nhân trên App di động để cập nhật trạng thái mới nhất.
                </div>

                <div class="footer">
                    &copy; 2026 Pickic Inc. Hỗ trợ khách hàng: support@pickic.io.vn<br>
                    Cảm ơn bạn đã đồng hành cùng cộng đồng Pickic!
                </div>
            </div>
        </body>
        </html>
        """;

        await SendEmailInternalAsync(toEmail, $"[Hóa đơn] Nâng cấp gói {planName} thành công - Pickic", htmlContent, cancellationToken);
    }

    private async Task SendEmailInternalAsync(string toEmail, string subject, string body, CancellationToken cancellationToken)
    {
        var smtpHost = _configuration["Email:SmtpHost"];
        var smtpPortStr = _configuration["Email:SmtpPort"];
        var smtpUser = _configuration["Email:SmtpUsername"];
        var smtpPass = _configuration["Email:SmtpPassword"];
        var senderEmail = _configuration["Email:SenderEmail"] ?? "no-reply@pickic.io.vn";
        var senderName = _configuration["Email:SenderName"] ?? "Pickic";

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
        {
            // Fail safe logging mode
            Console.WriteLine("================================================================================");
            Console.WriteLine($"[EMAIL MOCK SENDER] Sending email to {toEmail}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine($"Body Snippet: {(body.Length > 200 ? body.Substring(0, 200) + "..." : body)}");
            Console.WriteLine("================================================================================");
            return;
        }

        int port = 587;
        if (int.TryParse(smtpPortStr, out var parsedPort))
        {
            port = parsedPort;
        }

        try
        {
            using var client = new SmtpClient(smtpHost, port)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage, cancellationToken);
            Console.WriteLine($"[EMAIL SERVICE] Email successfully sent to {toEmail} with subject: {subject}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL SERVICE ERROR] Failed to send email to {toEmail}: {ex.Message}");
            Console.WriteLine($"[EMAIL FALLBACK] Subject: {subject}");
            Console.WriteLine($"[EMAIL FALLBACK] Body: {body}");
        }
    }
}

using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MimeKit;

class Program
{
    static async Task Main(string[] args)
    {
        string host = "smtp-relay.brevo.com";
        int port = 587;
        string user = "b35c78001@smtp-brevo.com";
        string pass = "xsmtpsib-b468718de77fb39b698b39f9003179413484a583566fb73787486e358bd50a68-6rYiGVq2D9scgWAW";
        string sender = "pickic.contact@gmail.com";
        string recipient = "thinhtt2412@gmail.com";

        Console.WriteLine("--- Test 4: MailKit SmtpClient with STARTTLS ---");
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Pickic", sender));
            message.To.Add(new MailboxAddress("", recipient));
            message.Subject = "Test MailKit STARTTLS";
            message.Body = new TextPart("plain") { Text = "This is a test from MailKit using STARTTLS" };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(user, pass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            Console.WriteLine("SUCCESS: MailKit STARTTLS sent successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FAILED: MailKit STARTTLS failed: {ex.Message}");
        }

        Console.WriteLine("\n--- Test 5: MailKit SmtpClient with port 465 (SslOnConnect) ---");
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Pickic", sender));
            message.To.Add(new MailboxAddress("", recipient));
            message.Subject = "Test MailKit SslOnConnect";
            message.Body = new TextPart("plain") { Text = "This is a test from MailKit using SslOnConnect" };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, 465, MailKit.Security.SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(user, pass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            Console.WriteLine("SUCCESS: MailKit SslOnConnect sent successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FAILED: MailKit SslOnConnect failed: {ex.Message}");
        }
    }
}

using System;
using Npgsql;

string connStr = "Host=db.jkyljrqealtypcgfuvgd.supabase.co;Database=postgres;Username=postgres;Password=Thinhtran2412;SSL Mode=Require;Trust Server Certificate=true";

using var conn = new NpgsqlConnection(connStr);
conn.Open();

Console.WriteLine("Cleaning up bookings and matches...");

// 1. Delete all bookings
using (var cmd = new NpgsqlCommand("DELETE FROM bookings", conn))
{
    int deleted = cmd.ExecuteNonQuery();
    Console.WriteLine($"Deleted {deleted} bookings.");
}

// 2. Reset match status to Active
using (var cmd = new NpgsqlCommand("UPDATE matches SET \"Status\" = 'Active'", conn))
{
    int updated = cmd.ExecuteNonQuery();
    Console.WriteLine($"Reset {updated} matches to Active.");
}

Console.WriteLine("Database cleanup completed successfully!");

using System;
using System.Reflection;
using System.Linq;

class Program
{
    static void Main()
    {
        var asm = typeof(PayOS.PayOSClient).Assembly;
        foreach (var type in asm.GetTypes())
        {
            if (type.Name.Contains("Webhook"))
            {
                Console.WriteLine(type.FullName);
                foreach (var prop in type.GetProperties())
                {
                    Console.WriteLine("  " + prop.Name + " : " + prop.PropertyType.Name);
                }
            }
        }
    }
}

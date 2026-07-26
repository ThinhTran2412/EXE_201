using System;
using System.Reflection;
using PayOS;

class Program
{
    static void Main()
    {
        var asm = typeof(PayOSClient).Assembly;
        foreach (var type in asm.GetTypes())
        {
            if (type.Namespace != null && type.Namespace.Contains("PayOS"))
            {
                var props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                foreach (var prop in props)
                {
                    if (prop.Name.Contains("Account") || prop.Name.Contains("Bank") || prop.Name.Contains("Counter"))
                    {
                        Console.WriteLine($"{type.FullName} -> {prop.Name} : {prop.PropertyType.Name}");
                    }
                }
            }
        }
    }
}

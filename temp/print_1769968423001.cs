
using System;
using System.Drawing;
using System.Drawing.Printing;
using System.Text;

public class ThermalPrinter
{
    public static void Main()
    {
        string printerName = "BlackCopper 80mm Series(2)";
        
        PrintDocument pd = new PrintDocument();
        pd.PrinterSettings.PrinterName = printerName;
        
        // Set paper size for 80mm thermal paper
        pd.DefaultPageSettings.PaperSize = new PaperSize("Custom", 315, 10000); // 80mm = 315 hundredths of an inch
        
        pd.PrintPage += new PrintPageEventHandler(PrintReceipt);
        
        try
        {
            pd.Print();
            Console.WriteLine("SUCCESS");
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: " + ex.Message);
        }
    }
    
    private static void PrintReceipt(object sender, PrintPageEventArgs ev)
    {
        Font font = new Font("Courier New", 9);
        Font fontBold = new Font("Courier New", 9, FontStyle.Bold);
        Font fontLarge = new Font("Courier New", 12, FontStyle.Bold);
        
        float yPos = 0;
        float leftMargin = 5;
        float topMargin = 5;
        
        // Header
        ev.Graphics.DrawString("=".PadRight(42, '='), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("TEST PRINT", fontLarge, Brushes.Black, leftMargin + 40, yPos + topMargin);
        yPos += fontLarge.GetHeight() + 5;
        
        ev.Graphics.DrawString("=".PadRight(42, '='), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight() + 10;
        
        // Shop Info
        ev.Graphics.DrawString("Shop: MY POS SHOP", font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("Date: 2/1/2026, 10:53:43 PM", font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight() + 10;
        
        // Items Header
        ev.Graphics.DrawString("-".PadRight(42, '-'), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("Item".PadRight(20) + "Qty".PadRight(10) + "Price", fontBold, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("-".PadRight(42, '-'), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        // Sample Items
        ev.Graphics.DrawString("Test Item 1".PadRight(20) + "2".PadRight(10) + "Rs.100", font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("Test Item 2".PadRight(20) + "1".PadRight(10) + "Rs.150", font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight() + 5;
        
        // Total
        ev.Graphics.DrawString("-".PadRight(42, '-'), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("TOTAL:".PadRight(30) + "Rs.350", fontBold, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight() + 10;
        
        // Footer
        ev.Graphics.DrawString("=".PadRight(42, '='), font, Brushes.Black, leftMargin, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("THANK YOU!", fontBold, Brushes.Black, leftMargin + 15, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("PLEASE VISIT AGAIN", font, Brushes.Black, leftMargin + 10, yPos + topMargin);
        yPos += font.GetHeight();
        
        ev.Graphics.DrawString("=".PadRight(42, '='), font, Brushes.Black, leftMargin, yPos + topMargin);
        
        ev.HasMorePages = false;
    }
}
    
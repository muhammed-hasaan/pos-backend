
$printerName = 'BlackCopper 80mm Series(2)'
$filePath = 'D:\\pos\\pos-backend\\temp\\print_1769974539700.txt'

try {
    # Read file content as ASCII to preserve formatting
    $content = Get-Content -Path $filePath -Raw -Encoding ASCII
    
    if (-not $content) {
        Write-Output "ERROR:EMPTY_FILE"
        exit 1
    }
    
    # Add form feed for paper handling
    $content = $content + "`f"
    
    # Send to printer using RAW data type
    $printCommand = @"
using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, [In] DOCINFO pDocInfo);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    
    [StructLayout(LayoutKind.Sequential)]
    public class DOCINFO {
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDataType;
    }
    
    public static bool SendBytesToPrinter(string printerName, byte[] bytes) {
        IntPtr printerHandle = IntPtr.Zero;
        DOCINFO docInfo = new DOCINFO();
        int bytesWritten = 0;
        bool success = false;
        
        docInfo.pDocName = "POS Receipt";
        docInfo.pDataType = "RAW";
        docInfo.pOutputFile = null;
        
        try {
            if (OpenPrinter(printerName, out printerHandle, IntPtr.Zero)) {
                if (StartDocPrinter(printerHandle, 1, docInfo)) {
                    if (StartPagePrinter(printerHandle)) {
                        success = WritePrinter(printerHandle, bytes, bytes.Length, out bytesWritten);
                        EndPagePrinter(printerHandle);
                    }
                    EndDocPrinter(printerHandle);
                }
                ClosePrinter(printerHandle);
            }
            return success;
        } catch (Exception ex) {
            return false;
        }
    }
}

`$@;

    # Add type definition
    Add-Type -TypeDefinition $printCommand -Language CSharp -ErrorAction Stop
    
    # Convert text to ASCII bytes
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($content)
    
    # Send to printer
    $result = [RawPrinterHelper]::SendBytesToPrinter($printerName, $bytes)
    
    if ($result) {
        Write-Output "SUCCESS:RAW_PRINT_COMPLETE"
        exit 0
    } else {
        Write-Output "ERROR:RAW_PRINT_FAILED"
        exit 1
    }
} catch {
    Write-Output "ERROR:$($_.Exception.Message)"
    exit 1
}

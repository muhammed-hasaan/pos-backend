
$printerName = 'BlackCopper 80mm Series(2)'
$filePath = 'D:\\pos\\pos-backend\\temp\\print_1769973588242.txt'

try {
    # Read file content
    $content = Get-Content -Path $filePath -Raw
    
    # Send to printer using RAW data type
    $printCommand = @"
using System;
using System.IO;
using System.Text;

public class RawPrinterHelper {
    [System.Runtime.InteropServices.DllImport("winspool.drv", CharSet = System.Runtime.InteropServices.CharSet.Auto, SetLastError = true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, [In] DOCINFO pDocInfo);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    
    [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    
    [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
    public class DOCINFO {
        [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPStr)]
        public string pDocName;
        [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPStr)]
        public string pOutputFile;
        [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPStr)]
        public string pDataType;
    }
    
    public static bool SendBytesToPrinter(string printerName, byte[] bytes) {
        IntPtr printerHandle = IntPtr.Zero;
        DOCINFO docInfo = new DOCINFO();
        int bytesWritten = 0;
        bool success = false;
        
        docInfo.pDocName = "POS Receipt";
        docInfo.pDataType = "RAW";
        
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
        } catch {
            return false;
        }
    }
}

# Convert text to bytes
$bytes = [System.Text.Encoding]::ASCII.GetBytes($content)
$result = [RawPrinterHelper]::SendBytesToPrinter($printerName, $bytes)

if ($result) {
    Write-Output "SUCCESS:RAW_PRINT_COMPLETE"
    exit 0
} else {
    Write-Output "ERROR:RAW_PRINT_FAILED"
    exit 1
}
"@

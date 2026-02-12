
Set objPrinter = CreateObject("WScript.Network")
objPrinter.AddWindowsPrinterConnection "BlackCopper 80mm Series(2)"
Set objShell = CreateObject("Shell.Application")
objShell.ShellExecute "notepad", "D:\pos\pos-backend\temp\raw_test_1769977639270.txt", "", "", 1

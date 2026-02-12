
Set WshShell = CreateObject("WScript.Shell")
Set objShell = CreateObject("Shell.Application")

' Open the file in Notepad
WshShell.Run "notepad.exe """ & "D:\\pos\\pos-backend\\temp\\notepad_print_1769968369983.txt" & """", 1, True

' Wait for Notepad to open
WScript.Sleep 1000

' Send Alt+F, P to open Print dialog
WshShell.SendKeys "%FP"

' Wait for Print dialog
WScript.Sleep 1000

' Select the correct printer
WshShell.SendKeys "{DOWN}"
WshShell.SendKeys "{DOWN}"
WshShell.SendKeys "{ENTER}"

' Wait and close Notepad
WScript.Sleep 2000
WshShell.SendKeys "%{F4}"
  
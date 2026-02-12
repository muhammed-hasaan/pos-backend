
      $printerName = 'BlackCopper 80mm Series(2)'
      $printer = Get-Printer -Name $printerName
      
      if (-not $printer) {
        throw "Printer '$printerName' not found"
      }
      
      # Convert hex string to byte array
      $bytes = [byte[]]::new(379)
      $hexString = '1b401b61011d211154455354205052494e540a1d21001b61003d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a53686f703a204d592053484f500a446174653a20322f312f323032362c2031303a35323a343920504d0a3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a4974656d20202020202020202020202051747920202050726963650a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d0a54657374204974656d2031202020202032202020203130302e30300a54657374204974656d2032202020202031202020203135302e30300a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d0a1b4501544f54414c3a20202020202020202020202020203235302e30300a1b45003d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a1b61015468616e6b20796f75210a506c6561736520766973697420616761696e0a0a0a0a1d564110'
      
      for ($i = 0; $i -lt $hexString.Length; $i += 2) {
        $bytes[$i/2] = [convert]::ToByte($hexString.Substring($i, 2), 16)
      }
      
      # Use Windows RAW printing
      Add-Type -AssemblyName System.Drawing
      
      $pd = New-Object System.Drawing.Printing.PrintDocument
      $pd.PrinterSettings.PrinterName = $printerName
      
      $pd.add_PrintPage({
        param($sender, $e)
        $e.Graphics.DrawString("TEST PRINT", (New-Object System.Drawing.Font("Courier New", 12)), [System.Drawing.Brushes]::Black, 10, 10)
        $e.Graphics.DrawString("Printer: $printerName", (New-Object System.Drawing.Font("Courier New", 10)), [System.Drawing.Brushes]::Black, 10, 40)
        $e.Graphics.DrawString("Date: 2/1/2026, 10:52:49 PM", (New-Object System.Drawing.Font("Courier New", 10)), [System.Drawing.Brushes]::Black, 10, 60)
        $e.Graphics.DrawString("Status: ✓ Connected", (New-Object System.Drawing.Font("Courier New", 10)), [System.Drawing.Brushes]::Black, 10, 80)
        $e.Graphics.DrawString("=".repeat(32), (New-Object System.Drawing.Font("Courier New", 10)), [System.Drawing.Brushes]::Black, 10, 100)
        $e.Graphics.DrawString("Thank you!", (New-Object System.Drawing.Font("Courier New", 10)), [System.Drawing.Brushes]::Black, 10, 120)
      })
      
      $pd.Print()
    
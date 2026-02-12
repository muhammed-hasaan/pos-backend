// Simplified Printer Service - Detect, Connect, and Print Only
import { exec } from 'child_process'
import { promisify } from 'util'
import { SerialPort } from 'serialport'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

// Load native printer module (C++ addon) as a best-effort fallback for raw printing on Windows
const require = createRequire(import.meta.url)
let printerNative = null
try {
  printerNative = require('printer')
  console.log('ℹ️  Native printer module loaded')
} catch (e) {
  console.log('ℹ️  Native printer module not available:', e.message)
}

class PrinterService {
  constructor() {
    this.connectedPrinter = null
    this.connectionType = null // 'serial' or 'windows'
    this.serialPort = null
    this.tempDir = path.join(__dirname, 'temp')
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  // 1. DETECT PRINTERS - Simple Windows and Serial detection
  async detectPrinters() {
    try {
      console.log('🔍 Detecting printers...')
      const printersMap = new Map()

      // Prefer PowerShell Get-Printer for reliable Windows printer names
      try {
        const { stdout } = await execAsync('powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"')
        const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l)
        lines.forEach((name) => {
          // normalize key
          const key = `windows_${name}`
          if (!printersMap.has(key)) {
            printersMap.set(key, {
              id: key,
              name: name,
              path: name,
              type: 'windows',
              port: 'USB'
            })
          }
        })
      } catch (err) {
        console.log('ℹ️  Could not get Windows printers via PowerShell:', err.message)
        // fallback to WMIC CSV parsing (best-effort)
        try {
          const { stdout } = await execAsync('wmic printer get Name,PortName /format:csv')
          const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l)
          lines.forEach((line) => {
            if (!line || /node/i.test(line) || /name/i.test(line)) return
            const tokens = line.split(',').map(s => s.trim()).filter(Boolean)
            // take the token that looks like a printer name (not 'Node')
            const name = tokens.length ? tokens[tokens.length - 1] : null
            if (name) {
              const key = `windows_${name}`
              if (!printersMap.has(key)) {
                printersMap.set(key, {
                  id: key,
                  name: name,
                  path: name,
                  type: 'windows',
                  port: 'USB'
                })
              }
            }
          })
        } catch (wmicErr) {
          console.log('ℹ️  WMIC fallback failed:', wmicErr.message)
        }
      }

      // Get available COM ports for thermal printers (serial)
      try {
        const { stdout } = await execAsync('powershell.exe "Get-WmiObject Win32_SerialPort | Select-Object DeviceID"')
        const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l)
        lines.forEach((line) => {
          // line may contain COM3 or something like "COM3"
          const match = line.match(/COM\d+/i)
          if (match) {
            const comPort = match[0].toUpperCase()
            const key = `serial_${comPort}`
            if (!printersMap.has(key)) {
              printersMap.set(key, {
                id: key,
                name: `USB Thermal Printer - ${comPort}`,
                path: comPort,
                type: 'serial',
                port: comPort
              })
            }
          }
        })
      } catch (err) {
        console.log('ℹ️  Could not detect serial ports:', err.message)
      }

      const printers = Array.from(printersMap.values())
      console.log(`✅ Found ${printers.length} printer(s)`)
      return printers
    } catch (error) {
      console.error('❌ Error detecting printers:', error.message)
      return []
    }
  }

  // 2. CONNECT TO PRINTER
  async connectPrinter(printerPath) {
    try {
      console.log(`🔌 Connecting to: ${printerPath}`)

      // Close existing connection
      if (this.serialPort) {
        try {
          await new Promise(resolve => {
            this.serialPort.close(() => resolve())
          })
        } catch (e) {
          // ignore
        }
      }

      // Determine printer type and connect
      if (printerPath.startsWith('COM') || /^COM\d+$/i.test(printerPath)) {
        // Serial/USB thermal printer
        await this.connectSerialPrinter(printerPath)
      } else {
        // Windows printer
        this.connectedPrinter = printerPath
        this.connectionType = 'windows'
      }

      console.log(`✅ Connected to: ${printerPath}`)
      
      return {
        success: true,
        printer: {
          name: printerPath,
          path: printerPath,
          connected: true,
          type: this.connectionType
        }
      }
    } catch (error) {
      console.error('❌ Connection failed:', error.message)
      throw error
    }
  }

  // Connect to serial (USB thermal) printer
  connectSerialPrinter(comPort) {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: comPort,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        autoOpen: false
      })

      port.open((err) => {
        if (err) {
          reject(new Error(`Cannot open ${comPort}: ${err.message}`))
        } else {
          this.serialPort = port
          this.connectedPrinter = comPort
          this.connectionType = 'serial'
          resolve()
        }
      })
    })
  }

  // 3. TEST PRINT - Simple and reliable
  async testPrint(shopInfo = {}) {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected')
      }

      console.log(`🖨️  Sending test print to ${this.connectedPrinter} (type=${this.connectionType})`)

      const receipt = this.generateReceipt(shopInfo)

      if (this.connectionType === 'serial') {
        await this.printSerial(receipt)
      } else {
        await this.printWindows(receipt)
      }

      return {
        success: true,
        message: 'Test print sent successfully',
        printer: this.connectedPrinter
      }
    } catch (error) {
      console.error('❌ Test print failed:', error.message)
      throw error
    }
  }

  // Print to Windows printer
  async printWindows(content) {
    try {
      const tempFile = path.join(this.tempDir, `print_${Date.now()}.txt`)
      fs.writeFileSync(tempFile, content, 'utf8')

      // Try printing using the connected printer name first
      // 1) Out-Printer (PowerShell) - streams file to named printer (reliable)
      try {
        console.log(`ℹ️  Attempting PowerShell Out-Printer to: ${this.connectedPrinter}`)
        // Use Get-Content -Raw to preserve newlines and stream to Out-Printer
        const safeTemp = tempFile.replace(/'/g, "''")
        const safePrinter = String(this.connectedPrinter).replace(/'/g, "''")
        const psOutPrinterCmd = `powershell -Command "Get-Content -Raw -Path '${safeTemp}' | Out-Printer -Name '${safePrinter}'"`
        const { stdout: outStd, stderr: outErr } = await execAsync(psOutPrinterCmd, { timeout: 20000, windowsHide: true })
        if (outStd) console.log('Out-Printer stdout:', outStd.trim())
        if (outErr) console.log('Out-Printer stderr:', outErr.trim())

        setTimeout(() => {
          try { fs.unlinkSync(tempFile) } catch (e) { }
        }, 2000)

        return true
      } catch (err) {
        console.log('ℹ️  Out-Printer failed:', err.message)
        // 2) Try the legacy PRINT command (some systems)
        try {
          console.log(`ℹ️  Attempting legacy PRINT command to: ${this.connectedPrinter}`)
          const cmd = `print /D:"${this.connectedPrinter}" "${tempFile}"`
          const { stdout, stderr } = await execAsync(cmd, { timeout: 20000, windowsHide: true })
          if (stdout) console.log('print stdout:', stdout.trim())
          if (stderr) console.log('print stderr:', stderr.trim())

          setTimeout(() => {
            try { fs.unlinkSync(tempFile) } catch (e) { }
          }, 2000)

          return true
        } catch (err2) {
          console.log('ℹ️  PRINT command failed:', err2.message)
          // 3) Try PowerShell Start-Process PrintTo
          try {
            console.log(`ℹ️  Attempting PowerShell Start-Process PrintTo to: ${this.connectedPrinter}`)
            const psCmd = `powershell -Command "Start-Process -FilePath '${safeTemp}' -Verb PrintTo -ArgumentList '${safePrinter}'"`
            const { stdout: psOut, stderr: psErr } = await execAsync(psCmd, { timeout: 20000, windowsHide: true })
            if (psOut) console.log('powershell stdout:', psOut.trim())
            if (psErr) console.log('powershell stderr:', psErr.trim())

            setTimeout(() => {
              try { fs.unlinkSync(tempFile) } catch (e) { }
            }, 2000)

            return true
          } catch (psErr) {
            console.log('ℹ️  PowerShell PrintTo failed:', psErr.message)
            // 4) Final fallback: try native printer module (raw ESC/POS) if available
            if (printerNative) {
              try {
                console.log('ℹ️  Attempting native raw print via printer addon')
                // Use ESC/POS bytes instead of plain text
                const escBuffer = this.textToEscPos(content)
                const jobId = await new Promise((resolve, reject) => {
                  printerNative.printDirect({
                    data: escBuffer,
                    printer: this.connectedPrinter,
                    type: 'RAW',
                    success: function(jobID) { resolve(jobID) },
                    error: function(err) { reject(err) }
                  })
                })
                console.log('ℹ️  Native print job sent, id=', jobId)
                try { fs.unlinkSync(tempFile) } catch (e) { }
                return true
              } catch (nativeErr) {
                console.log('ℹ️  Native print failed:', nativeErr && nativeErr.message ? nativeErr.message : nativeErr)
                try { fs.unlinkSync(tempFile) } catch (e) { }
                throw new Error(`Windows print failed (native): ${nativeErr.message || nativeErr}`)
              }
            }

            try { fs.unlinkSync(tempFile) } catch (e) { }
            throw new Error(`Windows print failed: ${psErr.message || err2.message || err.message}`)
          }
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Print to Serial (USB thermal) printer
  async printSerial(content) {
    return new Promise((resolve, reject) => {
      if (!this.serialPort) {
        reject(new Error('Serial port not open'))
        return
      }

      // Convert to ESC/POS commands
      const commands = this.textToEscPos(content)

      console.log(`ℹ️  Writing ${commands.length} bytes to serial port ${this.connectedPrinter}`)
      this.serialPort.write(commands, (err) => {
        if (err) {
          reject(new Error(`Serial write failed: ${err.message}`))
          return
        }

        // Ensure data is flushed
        if (typeof this.serialPort.drain === 'function') {
          this.serialPort.drain((drainErr) => {
            if (drainErr) {
              reject(new Error(`Serial drain failed: ${drainErr.message}`))
            } else {
              // small delay for printer to process
              setTimeout(() => resolve(), 300)
            }
          })
        } else {
          // If drain not available, wait briefly
          setTimeout(() => resolve(), 300)
        }
      })
    })
  }

  // Generate 80mm receipt (32 chars wide)
  generateReceipt(shopInfo = {}) {
    // For 3" (80mm) printers a common printable width is 48 characters per line
    const WIDTH = 48
    const line = (text) => {
      if (!text) return ''
      if (text.length >= WIDTH) return text.substring(0, WIDTH)
      return text.padEnd(WIDTH, ' ')
    }
    
    const center = (text) => {
      if (!text) return ' '.repeat(WIDTH)
      if (text.length >= WIDTH) return text.substring(0, WIDTH)
      const padTotal = Math.max(0, WIDTH - text.length)
      const leftPad = Math.floor(padTotal / 2)
      const rightPad = padTotal - leftPad
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
    }

    const lines = []
    lines.push('='.repeat(WIDTH))
    lines.push(center('TEST RECEIPT'))
    lines.push('='.repeat(WIDTH))
    lines.push('')
    
    if (shopInfo.name) {
      lines.push(line(shopInfo.name.substring(0, WIDTH)))
    }
    
    lines.push(line('Date: ' + new Date().toLocaleDateString()))
    lines.push(line('Time: ' + new Date().toLocaleTimeString()))
    lines.push('='.repeat(WIDTH))
    lines.push('')
    lines.push(line('Item              Price'))
    lines.push('='.repeat(WIDTH))
    lines.push(line('Test Item 1       Rs. 100.00'))
    lines.push(line('Test Item 2       Rs. 150.00'))
    lines.push('='.repeat(WIDTH))
    lines.push('')
    lines.push(line('TOTAL:            Rs. 250.00'))
    lines.push('='.repeat(WIDTH))
    lines.push('')
    lines.push(center('THANK YOU!'))
    lines.push(center('VISIT AGAIN'))
    lines.push('='.repeat(WIDTH))
    lines.push('\n\n\n')

    return lines.join('\n')
  }

  // Convert text to ESC/POS format
  textToEscPos(text) {
    const commands = []
    
    // Initialize printer
    commands.push(0x1b, 0x40) // ESC @
    
    // Add text
    const buffer = Buffer.from(text, 'utf8')
    for (let i = 0; i < buffer.length; i++) {
      commands.push(buffer[i])
    }
    
    // Cut paper
    commands.push(0x1d, 0x56, 0x42, 0x00) // GS V
    
    return Buffer.from(commands)
  }

  // Disconnect printer
  async disconnectPrinter() {
    if (this.serialPort) {
      return new Promise((resolve) => {
        this.serialPort.close(() => {
          this.connectedPrinter = null
          this.connectionType = null
          this.serialPort = null
          resolve()
        })
      })
    }
    
    this.connectedPrinter = null
    this.connectionType = null
  }

  // Get connected printer info
  getConnectedPrinter() {
    if (!this.connectedPrinter) return null
    
    return {
      name: this.connectedPrinter,
      path: this.connectedPrinter,
      connected: true,
      type: this.connectionType
    }
  }
}

// Export singleton instance
export default new PrinterService();
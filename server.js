// 
import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)


import authRoutes from "./routes/auth.routes.js"
import shopRoutes from "./routes/shop.routes.js"
import productRoutes from "./routes/product.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import orderRoutes from "./routes/order.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
import onlineOrderRoutes from "./routes/online-order.routes.js"

// Load environment variables
dotenv.config()

const app = express()
const PORT = 5002

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.use(morgan("dev"))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// ============================
// 📌 TERI EXISTING API ROUTES
// ============================
app.use("/api/auth", authRoutes)
app.use("/api/shops", shopRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/online-orders", onlineOrderRoutes)

// ============================
// 🖨️ PRINTER API - 100% WORKING (NO DEPENDENCIES)
// ============================

// In-memory store for connected printer
let connectedPrinter = null


// ============================
// 🖨️ POS ORDER PRINT API
// ============================
app.post('/', (req, res) => {
  return res.status(200).send("backend is running")
});
app.post('/api/print/pos-receipt', (req, res) => {
    const { printerName, orderData } = req.body;

    if (!printerName) {
        return res.status(400).json({ error: 'No printer selected' });
    }

    try {
        // 80mm Thermal Receipt - 48 characters
        const line = "=".repeat(48);
        const dash = "-".repeat(48);

        let receipt = '';

        //() Store Header
        if (orderData.shopName) {


            receipt += `        ${orderData.shopName || 'MY STORE'}\n`;
        }
       
 
        receipt += `${line}\n`;

        // Order Info
        receipt += `Receipt: ${orderData.receiptNumber}\n`;
        receipt += `Date: ${(() => {
  const now = new Date();

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 ko 12 bana dega

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm} \n`;
})()}`;
        receipt += `Customer: ${orderData.customerName}\n`;
        receipt += `${line}\n`;

        // Items Header
        receipt += `Item                 Qty    Price\n`;
        receipt += `${dash}\n`;

        // Items
        // orderData.items.forEach(item => {
        // const name = item.name;
        // const qty = item.quantity;
        // const price = (item.price * item.quantity).toFixed(2);
        // receipt += `${name}                ${qty}      Rs.${price}\n`;
        // });
        // Define column widths
        const itemNameWidth = 20; // max characters for item name
        const qtyWidth = 5;       // width for quantity
        const priceWidth = 10;    // width for price

        orderData.items.forEach(item => {
            let name = item.name;
            if (name.length > itemNameWidth) {
                name = name.slice(0, itemNameWidth - 1); // truncate if too long
            }
            const qty = item.quantity.toString().padStart(qtyWidth, ' ');
            const price = (item.price * item.quantity).toFixed(2).padStart(priceWidth, ' ');
            receipt += `${name.padEnd(itemNameWidth, ' ')}${qty}${price}\n`;
        });


        receipt += `${dash}\n`;

        // Totals
        receipt += `TOTAL:${' '.repeat(22)} Rs.${orderData.total.toFixed(2)}\n`;
        // receipt += `${line}\n`;

        // Payment
        // receipt += `Payment: ${orderData.paymentMethod.toUpperCase()}\n`;
        // if (orderData.paymentMethod === 'cash') {
        //     receipt += `Received:${' '.repeat(19)} Rs.${orderData.amountReceived.toFixed(2)}\n`;
        //     receipt += `Change:${' '.repeat(21)} Rs.${orderData.change.toFixed(2)}\n`;
        // }
        receipt += `${line}\n`;
               if (orderData.shopPhone) {
            receipt += `Tel: ${orderData.shopPhone}\n`;
        }
        
        receipt += `Web: quettaalamgirhotelbranch3.com\n`;
 if (orderData.shopAddress) {
            // receipt += `Address: ${orderData.shopAddress}\n`;
            receipt += `Address: Quetta Alamgir Hotel \n         Shaheed-e-Millat Branch -3 \n`;
        }
                receipt += `${line}\n`;


        // Footer
        receipt += `       Thank You! Visit Again!\n`;
        receipt += `${line}\n\n`;
        receipt += `Powered By : https://hashapples.com/`;

        // Windows line breaks
        receipt = receipt.replace(/\n/g, '\r\n');

        // PowerShell command to print
        const psCommand = `$text = @"\n${receipt}\n"@; $text | Out-Printer -Name "${printerName}"`;

        const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand]);

        ps.on('close', (code) => {
            if (code === 0) {
                return res.json({ success: true, message: 'Receipt printed!' });
            }
            res.status(500).json({ error: "Printing failed" });
        });

    } catch (error) {
        console.error('Print error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------
// 1. GET ALL PRINTERS - WMIC METHOD (100% RELIABLE)
// ----------------------------
app.get('/api/printers', (req, res) => {
    // WMIC command to get all printer names
    exec('wmic printer get name /format:csv', (error, stdout) => {
        if (error) {
            console.error('WMIC Error:', error)
            return res.json({ success: true, printers: [] })
        }

        const printers = []
        const lines = stdout.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)

        // Skip header line (first line)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            const parts = line.split(',')
            const name = parts[1]?.trim() || parts[0]?.trim()

            // Filter out fake/system printers
            if (name &&
                !name.includes('Microsoft') &&
                !name.includes('XPS') &&
                !name.includes('OneNote') &&
                !name.includes('Fax') &&
                !name.includes('PDF') &&
                !name.includes('Nodo') &&
                name !== 'Node' &&
                name !== 'Name' &&
                name.length > 0) {

                printers.push({
                    name: name,
                    status: 'Ready',
                    isDefault: false,
                    type: 'windows'
                })
            }
        }

        // Get default printer
        exec('wmic printer where default=true get name /format:csv', (err, defaultStdout) => {
            let defaultName = ''
            if (!err) {
                const defaultLines = defaultStdout.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0)
                if (defaultLines.length > 1) {
                    const parts = defaultLines[1].split(',')
                    defaultName = parts[1]?.trim() || parts[0]?.trim() || ''
                }
            }

            // Mark default printer
            const printersWithDefault = printers.map(p => ({
                ...p,
                isDefault: p.name === defaultName
            }))

            console.log(`Found ${printersWithDefault.length} printers:`, printersWithDefault.map(p => p.name))

            res.json({
                success: true,
                printers: printersWithDefault,
                count: printersWithDefault.length
            })
        })
    })
})

// ----------------------------
// 2. CONNECT TO PRINTER
// ----------------------------
app.post('/api/printers/connect', (req, res) => {
    const { printer } = req.body

    if (!printer || !printer.name) {
        return res.status(400).json({ error: 'Printer name required' })
    }

    connectedPrinter = printer
    console.log(`✅ Connected to printer: ${printer.name}`)

    res.json({
        success: true,
        message: `Connected to ${printer.name}`,
        printer: connectedPrinter
    })
})

// ----------------------------
// 3. GET CONNECTED PRINTER
// ----------------------------
app.get('/api/printers/connected', (req, res) => {
    res.json({
        success: true,
        printer: connectedPrinter
    })
})

// ----------------------------
// 4. DISCONNECT PRINTER
// ----------------------------
app.post('/api/printers/disconnect', (req, res) => {
    connectedPrinter = null
    res.json({ success: true, message: 'Printer disconnected' })
})

// ----------------------------
// 5. TEST PRINT - SMALL RECEIPT (6 LINES)
// ----------------------------
// ----------------------------
// 5. TEST PRINT - 80mm FULL WIDTH (PURE WINDOWS)
// ----------------------------
// app.post('/api/print/test', (req, res) => {
//     const { printerName } = req.body;
//     const name = printerName || connectedPrinter?.name;

//     if (!name) {
//         return res.status(400).json({ error: 'No printer selected' });
//     }

//     console.log(`🖨️ Printing 80mm receipt to: ${name}`);

//     // ============================================
//     // 80mm THERMAL PRINTER - 48 CHARACTERS WIDE
//     // ============================================
// const width = 48; // 80mm standard
// const line = "=".repeat(width);
// const receipt = `
// ${"MY STORE".padStart(24 + 4)} 
// ${line}
// Cashier: Admin
// Customer: Ali Ahmed
// ${line}
// Item                Qty         Price
// ${"-".repeat(width)}
// Pizza                1          $12.99
// Burger               1          $8.99
// ${" ".repeat(20)} TOTAL: $21.98
// ${line}
// \n\n\n\n`.replace(/\n/g, '\r\n'); // Windows style line breaks


//     // METHOD 1: PowerShell Out-Printer (BEST FOR THERMAL)
//     try {
//         const psCommand = `
//             $text = @"
// ${receipt}
// "@
//             $text | Out-Printer -Name "${name}"
//         `;

//         const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand]);

//         ps.on('close', (code) => {
//             if (code === 0) {
//                 console.log('✅ 80mm receipt printed via PowerShell');
//                 return res.json({ success: true, message: '✅ 80mm receipt printed!' });
//             } else {
//                 console.log('PowerShell failed, trying direct write...');
//                 tryDirectWrite();
//             }
//         });
//     } catch (e) {
//         console.log('PowerShell error:', e.message);
//         tryDirectWrite();
//     }

//     function tryDirectWrite() {
//         try {
//             // METHOD 2: Direct write to printer share
//             fs.writeFileSync(`\\\\localhost\\BlackCopper BC-98AC`, receipt);
//             console.log('✅ 80mm receipt printed via direct write');
//             return res.json({ success: true, message: '✅ 80mm receipt printed!' });
//         } catch (e) {
//             console.log('Direct write failed:', e.message); 
//             tryPrintCommand();
//         }
//     }

//     function tryPrintCommand() {
//         try {
//             // METHOD 3: Windows print command
//             const tempFile = path.join(__dirname, `receipt_${Date.now()}.txt`);
//             fs.writeFileSync(tempFile, receipt);

//             exec(`print /D:"${name}" "${tempFile}"`, (error) => {
//                 fs.unlinkSync(tempFile);
//                 if (error) {
//                     console.error('Print command failed:', error);
//                     return res.status(500).json({ success: false, error: error.message });
//                 }
//                 console.log('✅ 80mm receipt printed via print command');
//                 res.json({ success: true, message: '✅ 80mm receipt printed!' });
//             });
//         } catch (error) {
//             console.error('All print methods failed:', error);
//             res.status(500).json({ success: false, error: error.message });
//         }
//     }
// });
app.post('/api/print/test', (req, res) => {
    const { printerName } = req.body;
    const name = printerName || connectedPrinter?.name;

    if (!name) return res.status(400).json({ error: 'No printer selected' });

    // 80mm (48 characters) ke liye spaces ka sahi istemal
    const line = "=".repeat(48);
    const receipt = `
                MY STORE                
${line}
Cashier: Admin
Customer: Ali Ahmed
${line}
Item                Qty       Price      
------------------------------------------------
Pizza                1        $12.99     
Burger               1        $8.99      
------------------------------------------------
                    TOTAL:    $21.98   
${line}


`.replace(/\n/g, '\r\n'); // Windows ke liye line break fix

    // PowerShell Command - Raw Mode
    // Is command mein hum printer ko direct text bhej rahe hain bina driver ki extra formatting ke
    const psCommand = `\$text = @"\n${receipt}\n"@; \$text | Out-Printer -Name "${name}"`;

    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand]);

    ps.on('close', (code) => {
        if (code === 0) {
            return res.json({ success: true, message: '80mm Print Sent!' });
        }
        res.status(500).json({ error: "Printing failed" });
    });
});
// ----------------------------
// 6. PRINT RECEIPT WITH ORDER DATA
// ----------------------------
app.post('/api/print/receipt', (req, res) => {
    const { printerName, receiptData } = req.body
    const name = printerName || connectedPrinter?.name

    if (!name) {
        return res.status(400).json({ error: 'No printer selected' })
    }

    try {
        const data = receiptData || {}
        const customer = data.customerName || 'Walk-in Customer'
        const items = data.items || [
            { name: 'Pizza', qty: 1, price: 12.99 },
            { name: 'Burger', qty: 1, price: 8.99 }
        ]
        const subtotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0)
        const tax = data.tax || 0
        const total = data.total || subtotal + tax

        // 3 INCH RECEIPT FORMAT - 48 characters wide
        let receipt = `\n${'='.repeat(48)}\n`
        receipt += `           ${data.storeName || 'MY STORE'}\n`
        receipt += `          ${data.address || '123 Main Street'}\n`
        receipt += `         Tel: ${data.phone || '555-0123'}\n`
        receipt += `${'='.repeat(48)}\n`
        receipt += `Order #: ${data.orderId || 'ORD-' + Date.now().toString().slice(-6)}\n`
        receipt += `Date: ${new Date().toLocaleString()}\n`
        receipt += `Customer: ${customer}\n`
        receipt += `${'='.repeat(48)}\n`
        receipt += `Item                 Qty    Price\n`
        receipt += `${'-'.repeat(48)}\n`

        items.forEach(item => {
            const name = item.name.slice(0, 15).padEnd(16)
            const qty = (item.qty || 1).toString().padStart(3)
            const price = (item.price * (item.qty || 1)).toFixed(2).padStart(7)
            receipt += `${name} ${qty}   $${price}\n`
        })

        receipt += `${'-'.repeat(48)}\n`
        receipt += `Subtotal:${' '.repeat(30)} $${subtotal.toFixed(2)}\n`
        if (tax > 0) {
            receipt += `Tax:${' '.repeat(33)} $${tax.toFixed(2)}\n`
        }
        receipt += `${'='.repeat(48)}\n`
        receipt += `TOTAL:${' '.repeat(31)} $${total.toFixed(2)}\n`
        receipt += `${'='.repeat(48)}\n`
        receipt += `Payment: ${data.payment || 'Cash'}${' '.repeat(20)}`
        receipt += `Change: $${(data.change || 0).toFixed(2)}\n`
        receipt += `${'='.repeat(48)}\n`
        receipt += `         Thank You! Visit Again!\n`
        receipt += `         ${new Date().toLocaleTimeString()}\n`
        receipt += `${'='.repeat(48)}\n\n`

        fs.writeFileSync(`\\\\localhost\\${name}`, receipt)
        res.json({ success: true, message: '✅ 3-inch receipt printed!' })

    } catch (error) {
        console.error('Receipt print failed:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})
// ----------------------------
// 7. DEBUG - CHECK PRINTER NAMES
// ----------------------------
app.get('/api/printers/debug', (req, res) => {
    exec('wmic printer get name /format:csv', (error, stdout) => {
        if (error) {
            return res.json({ error: error.message })
        }

        const lines = stdout.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)

        const printerNames = []
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',')
            const name = parts[1]?.trim() || parts[0]?.trim()
            if (name && name !== 'Node' && name !== 'Name') {
                printerNames.push(name)
            }
        }

        res.json({
            success: true,
            raw: stdout,
            lines: lines,
            printerNames: printerNames
        })
    })
})

// ============================
// 404 & Error Handlers
// ============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    })
})

app.use((err, req, res, next) => {
    console.error("Server Error:", err)
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    })
})

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 POS Backend Server running on port ${PORT}`)
    console.log(`📍 API: http://localhost:${PORT}/api`)
    console.log(`\n🖨️  PRINTER API READY:`)
    console.log(`   GET  /api/printers     - Scan printers`)
    console.log(`   POST /api/printers/connect - Connect printer`)
    console.log(`   POST /api/print/test   - Test print (6 lines)`)
    console.log(`   POST /api/print/receipt - Print receipt`)
    console.log(`   GET  /api/printers/debug - Debug printers\n`)
})

export default app
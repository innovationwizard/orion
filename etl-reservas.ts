#!/usr/bin/env node
/**
 * ETL Script: Reservas.xlsx → PostgreSQL (Production Schema v2)
 * 
 * Extracts sales and payment data from Excel and loads into production database.
 * Schema: uuid_v7(), row_version tracking, proper constraints
 * 
 * Run: EXCEL_PATH=./Reservas.xlsx npx tsx etl-reservas.ts
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EXCEL_PATH = process.env.EXCEL_PATH || './Reservas.xlsx';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Project name mapping: Excel sheet → DB project name
const PROJECT_MAPPING: Record<string, string> = {
  'BENESTARE ': 'benestare',
  'BOULEVARD 5': 'boulevard_5',
  'BL-TAPIAS': 'bl_tapias',
  'SANTA ELISA': 'santa_elisa',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Excel serial date to YYYY-MM-DD
 */
function excelDateToISO(serial: number): string {
  const epoch = new Date(1900, 0, 1);
  const days = serial - 2; // Excel bug: treats 1900 as leap year
  const date = new Date(epoch.getTime() + days * 86400000);
  return date.toISOString().split('T')[0];
}

/**
 * Normalize client name (trim, title case)
 */
function normalizeClientName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Parse currency string or number to decimal
 */
function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  }
  return 0;
}

/**
 * Safe get cell value
 */
function getCellValue(row: any[], index: number): any {
  return row && row[index] !== undefined && row[index] !== null ? row[index] : null;
}

// ============================================================================
// ETL PIPELINE
// ============================================================================

interface ExtractedSale {
  project: string;
  unitNumber: string;
  clientName: string;
  salesRep: string | null;
  reservationDate: string | null;
  status: string;
  priceWithTax: number;
  priceWithoutTax: number;
  downPayment: number;
  referralName: string | null;
  referralApplies: boolean;
  promiseSignedDate: string | null;
  deedSignedDate: string | null;
  payments: Array<{
    date: string;
    amount: number;
    type: 'reservation' | 'down_payment' | 'financed_payment';
  }>;
}

async function extractFromSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  projectName: string
): Promise<ExtractedSale[]> {
  console.log(`\n📊 Processing: ${sheetName} → ${projectName}`);
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
  
  // Find header row (search first 15 rows, look for "Apto")
  let headerRowIndex = -1;
  let aptoColIndex = -1;
  
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (cell && typeof cell === 'string') {
        const normalized = cell.trim().toLowerCase().replace(/\./g, '');
        if (normalized === 'apto' || normalized === 'appto') {
          headerRowIndex = i;
          aptoColIndex = j;
          break;
        }
      }
    }
    if (headerRowIndex >= 0) break;
  }
  
  if (headerRowIndex === -1) {
    console.warn(`⚠️  No header row found in ${sheetName}`);
    return [];
  }
  
  const headers = data[headerRowIndex];
  console.log(`   Found ${headers.length} columns, header at row ${headerRowIndex + 1}, "Apto" at col ${aptoColIndex + 1}`);
  
  // Map column indices with priority to exact/simple matches
  const colMap: Record<string, number> = { unitNumber: aptoColIndex };
  
  headers.forEach((h: any, i: number) => {
    if (!h) return;
    const header = String(h).trim().toLowerCase();
    const headerClean = header.replace(/\s+/g, ' ');
    
    // Use FIRST match and prioritize exact/simple headers
    
    // Cliente: prefer exact "cliente" over "estatus cliente"
    if (!colMap.client && headerClean === 'cliente') {
      colMap.client = i;
    } else if (!colMap.client && header.includes('cliente') && headerClean.split(' ').length <= 2) {
      colMap.client = i;
    }
    
    // Vendedor
    if (!colMap.salesRep && (headerClean === 'vendedor' || headerClean.includes('vended'))) {
      colMap.salesRep = i;
    }
    
    // Reservation date
    if (!colMap.reservationDate && 
        (header.includes('reserv') || header.includes('fecha')) && 
        !header.includes('total') && 
        !header.includes('monto')) {
      colMap.reservationDate = i;
    }
    
    // Status: prefer "estatus cliente" over "status inmueble"
    if (!colMap.status && header.includes('estatus') && header.includes('cliente')) {
      colMap.status = i;
    } else if (!colMap.status && (header.includes('estatus') || header.includes('status'))) {
      colMap.status = i;
    }
    
    // Price: exact match for "precio de venta"
    if (!colMap.price && header.includes('precio') && header.includes('venta')) {
      colMap.price = i;
    }
    
    // Down payment - prefer exact "enganche" not compound phrases
    if (!colMap.downPayment && headerClean === 'enganche') {
      colMap.downPayment = i;
    } else if (!colMap.downPayment && 
               header.includes('enganche') && 
               !header.includes('saldo') && 
               !header.includes('cuota') && 
               !header.includes('+') &&
               headerClean.split(' ').length <= 2) {
      colMap.downPayment = i;
    }
  });
  
  // Validate critical columns found
  const criticalCols = ['unitNumber', 'client', 'status', 'price', 'downPayment'];
  const missingCols = criticalCols.filter(col => colMap[col] === undefined);
  if (missingCols.length > 0) {
    console.warn(`   ⚠️  Missing columns: ${missingCols.join(', ')}`);
  }
  
  console.log(`   Column mapping:`, colMap);
  
  // Find date columns (Excel serial numbers >= 44000)
  const dateColumns: Array<{ index: number; date: string }> = [];
  headers.forEach((h: any, i: number) => {
    if (typeof h === 'number' && h >= 44000 && h <= 50000) {
      dateColumns.push({ index: i, date: excelDateToISO(h) });
    }
  });
  
  console.log(`   Found ${dateColumns.length} date columns`);
  
  // Extract sales
  const sales: ExtractedSale[] = [];
  
  // Keywords that indicate summary/aggregate sections (stop processing)
  const STOP_KEYWORDS = ['TOTAL', 'FLUJO', 'DESISTIMIENTO', 'PORCENTAJE', 'DIFERENCIA', 'PPTO', 'ESTIMADO'];
  
  for (let rowIdx = headerRowIndex + 1; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row || row.length === 0) continue;
    
    // Check if this is a summary/aggregate row (stop processing)
    const firstFewCells = row.slice(0, 10).filter(c => c !== null && c !== undefined);
    const hasSummaryKeyword = firstFewCells.some((cell: any) => {
      if (typeof cell === 'string') {
        const normalized = cell.trim().toUpperCase();
        return STOP_KEYWORDS.some(kw => normalized.includes(kw));
      }
      return false;
    });
    
    if (hasSummaryKeyword) {
      console.log(`   Stopped at row ${rowIdx + 1} (summary section detected)`);
      break;
    }
    
    const unitNumber = getCellValue(row, colMap.unitNumber);
    const clientName = getCellValue(row, colMap.client);
    const status = getCellValue(row, colMap.status);
    
    // Skip if no unit or status
    if (!unitNumber || !status) continue;
    
    // Skip reserved/cancelled/special rows (no actual client)
    const clientStr = String(clientName || '').trim().toUpperCase();
    const statusStr = String(status).toLowerCase();
    
    if (!clientName || clientStr === '' || clientStr === 'RESERVADO' || clientStr === 'DESISTIDO') {
      continue;
    }
    
    // Skip non-name values (numbers, formulas, status text)
    if (/^\d+$/.test(clientStr) || clientStr.includes('ENGANCHE') || clientStr.includes('CLIENTE')) {
      continue;
    }
    
    // Skip available units
    if (statusStr.includes('disponible')) continue;
    
    // Skip if status indicates cancellation
    if (statusStr.includes('cancel') || statusStr.includes('desisti')) continue;
    
    const price = parseCurrency(getCellValue(row, colMap.price));
    const downPayment = parseCurrency(getCellValue(row, colMap.downPayment));
    
    // Skip if no price (critical field)
    if (price <= 0) continue;
    
    // Default down payment to 10% if missing
    const finalDownPayment = downPayment > 0 ? downPayment : price * 0.10;
    
    const salesRep = getCellValue(row, colMap.salesRep);
    const reservationDateRaw = getCellValue(row, colMap.reservationDate);
    
    // Extract payments from date columns
    const payments: ExtractedSale['payments'] = [];
    dateColumns.forEach(({ index, date }) => {
      const amount = parseCurrency(getCellValue(row, index));
      if (amount > 0) {
        payments.push({
          date,
          amount,
          type: 'down_payment',
        });
      }
    });
    
    // First payment is likely reservation
    if (payments.length > 0) {
      payments[0].type = 'reservation';
    }
    
    sales.push({
      project: projectName,
      unitNumber: String(unitNumber),
      clientName: normalizeClientName(String(clientName)),
      salesRep: salesRep ? String(salesRep).trim() : null,
      reservationDate: typeof reservationDateRaw === 'number' 
        ? excelDateToISO(reservationDateRaw) 
        : null,
      status: String(status),
      priceWithTax: price,
      priceWithoutTax: price / 1.12, // Guatemala IVA 12%
      downPayment: finalDownPayment,
      referralName: null,
      referralApplies: false,
      promiseSignedDate: null,
      deedSignedDate: null,
      payments,
    });
  }
  
  console.log(`   ✅ Extracted ${sales.length} sales with ${sales.reduce((sum, s) => sum + s.payments.length, 0)} payments`);
  return sales;
}

async function loadToDatabase(sales: ExtractedSale[]) {
  console.log(`\n💾 Loading ${sales.length} sales to database...`);
  
  // Get unique project names
  const projectNames = [...new Set(sales.map(s => s.project))];
  console.log(`\n🏗️  Setting up ${projectNames.length} projects...`);
  
  // Create/fetch all projects upfront
  const projectCache = new Map<string, string>();
  
  for (const projectName of projectNames) {
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName)
      .maybeSingle();
    
    if (existingProject) {
      projectCache.set(projectName, existingProject.id);
      console.log(`   ✅ Found: ${projectName}`);
    } else {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({ name: projectName })
        .select('id')
        .single();
      
      if (createError || !newProject) {
        console.error(`   ❌ Failed to create: ${projectName}`);
        console.error(`      Error:`, JSON.stringify(createError, null, 2));
        console.error(`      Stopping ETL - fix project creation issue first`);
        process.exit(1);
      }
      
      projectCache.set(projectName, newProject.id);
      console.log(`   ✅ Created: ${projectName}`);
    }
  }
  
  console.log(`\n💾 Importing sales...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const sale of sales) {
    try {
      // 1. Get project ID from cache
      const projectId = projectCache.get(sale.project);
      if (!projectId) {
        console.error(`❌ Project not in cache: ${sale.project}`);
        errorCount++;
        continue;
      }
      
      // 1. Get or create client
      // Schema: id (uuid_v7), full_name (text NOT NULL), tax_id, email, phone, created_at, updated_at, row_version
      let clientId: string;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('full_name', sale.clientName)
        .maybeSingle();
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ 
            full_name: sale.clientName 
            // id, created_at, updated_at, row_version auto-generated
          })
          .select('id')
          .single();
        
        if (clientError || !newClient) {
          console.error(`❌ Failed to create client: ${sale.clientName}`, clientError?.message);
          errorCount++;
          continue;
        }
        clientId = newClient.id;
      }
      
      // 2. Get or create unit
      // Schema: id, project_id, unit_number, price_with_tax, price_without_tax, down_payment_amount, 
      //         status (unit_status enum, default 'available'), created_at, updated_at, row_version
      let unitId: string;
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('project_id', projectId)
        .eq('unit_number', sale.unitNumber)
        .maybeSingle();
      
      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert({
            project_id: projectId,
            unit_number: sale.unitNumber,
            price_with_tax: sale.priceWithTax,
            price_without_tax: sale.priceWithoutTax,
            down_payment_amount: sale.downPayment,
            status: 'sold', // unit_status enum
            // id, created_at, updated_at, row_version auto-generated
          })
          .select('id')
          .single();
        
        if (unitError || !newUnit) {
          console.error(`❌ Failed to create unit: ${sale.unitNumber}`, unitError?.message);
          errorCount++;
          continue;
        }
        unitId = newUnit.id;
      }
      
      // 3. Check if sale already exists
      // Schema: id, project_id, unit_id, client_id, sales_rep_id (text NOT NULL), sale_date (date NOT NULL),
      //         price_with_tax, price_without_tax, down_payment_amount, financed_amount,
      //         referral_name, referral_applies (boolean NOT NULL, default false),
      //         status (sale_status enum, default 'active'), promise_signed_date, deed_signed_date,
      //         created_at, updated_at, row_version
      const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('unit_id', unitId)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle();
      
      let saleId: string;
      
      if (existingSale) {
        saleId = existingSale.id;
        console.log(`   ⏭️  Sale exists: ${sale.project} - ${sale.unitNumber}`);
      } else {
        // Create sale
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            project_id: projectId,
            unit_id: unitId,
            client_id: clientId,
            sales_rep_id: sale.salesRep || 'unknown', // NOT NULL
            sale_date: sale.reservationDate || new Date().toISOString().split('T')[0], // NOT NULL
            price_with_tax: sale.priceWithTax,
            price_without_tax: sale.priceWithoutTax,
            down_payment_amount: sale.downPayment,
            financed_amount: sale.priceWithTax - sale.downPayment,
            referral_name: sale.referralName, // nullable
            referral_applies: sale.referralApplies, // boolean NOT NULL, default false
            status: 'active', // sale_status enum, default 'active'
            promise_signed_date: sale.promiseSignedDate, // nullable
            deed_signed_date: sale.deedSignedDate, // nullable
            // id, created_at, updated_at, row_version auto-generated
          })
          .select('id')
          .single();
        
        if (saleError || !newSale) {
          console.error(`❌ Failed to create sale: ${sale.project} - ${sale.unitNumber}`, saleError?.message);
          errorCount++;
          continue;
        }
        saleId = newSale.id;
        
        // 4. Create payments (will auto-trigger commission calculation via trigger)
        // Schema: id, sale_id (uuid NOT NULL), payment_date (date NOT NULL), amount (numeric NOT NULL),
        //         payment_type (payment_type enum NOT NULL), payment_method (payment_method enum nullable),
        //         notes (text nullable), created_at, updated_at, row_version
        for (const payment of sale.payments) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              sale_id: saleId,
              payment_date: payment.date,
              amount: payment.amount,
              payment_type: payment.type, // payment_type enum NOT NULL
              payment_method: 'cash', // payment_method enum nullable, default 'cash'
              // notes: null, // optional
              // id, created_at, updated_at, row_version auto-generated
            });
          
          if (paymentError) {
            console.warn(`⚠️  Failed to create payment: ${payment.date}`, paymentError.message);
          }
        }
        
        console.log(`   ✅ Created: ${sale.project} - ${sale.unitNumber} (${sale.payments.length} payments)`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`❌ Error processing sale: ${sale.project} - ${sale.unitNumber}`, error?.message || error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} created, ${errorCount} errors`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 ETL: Reservas.xlsx → PostgreSQL (Production Schema v2)\n');
  console.log(`📂 Reading: ${EXCEL_PATH}`);
  
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`📄 Sheets: ${workbook.SheetNames.length}`);
  
  const allSales: ExtractedSale[] = [];
  
  // Extract from each project sheet
  for (const [sheetName, projectName] of Object.entries(PROJECT_MAPPING)) {
    if (workbook.SheetNames.includes(sheetName)) {
      const sales = await extractFromSheet(workbook, sheetName, projectName);
      allSales.push(...sales);
    } else {
      console.warn(`⚠️  Sheet not found: ${sheetName}`);
    }
  }
  
  console.log(`\n📦 Total extracted: ${allSales.length} sales`);
  
  // Load to database
  await loadToDatabase(allSales);
  
  console.log('\n✅ ETL Complete');
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

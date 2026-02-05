#!/usr/bin/env node
/**
 * ETL Script: Reservas.xlsx → PostgreSQL
 * 
 * Extracts sales and payment data from Excel and loads into clean schema.
 * Run: npx tsx etl-reservas.ts
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EXCEL_PATH = process.env.EXCEL_PATH || '/mnt/user-data/uploads/Reservas.xlsx';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
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
        if (normalized === 'apto' || normalized === 'apto' || normalized === 'appto') {
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
  console.log(`   Found ${headers.length} columns, header at row ${headerRowIndex}, "Apto" at col ${aptoColIndex}`);
  
  // Map column indices (search near Apto column)
  const colMap: Record<string, number> = { unitNumber: aptoColIndex };
  
  headers.forEach((h: any, i: number) => {
    if (!h) return;
    const header = String(h).trim().toLowerCase();
    
    // Be flexible with matching
    if (header.includes('cliente')) colMap.client = i;
    if (header.includes('vendedor')) colMap.salesRep = i;
    if ((header.includes('reserv') || header.includes('fecha')) && !header.includes('total')) {
      if (!colMap.reservationDate) colMap.reservationDate = i;
    }
    if (header.includes('estatus') || header.includes('status')) colMap.status = i;
    if (header.includes('precio') && header.includes('venta')) colMap.price = i;
    if (header.includes('enganche')) colMap.downPayment = i;
  });
  
  // Validate critical columns found
  const criticalCols = ['unitNumber', 'client', 'status', 'price', 'downPayment'];
  const missingCols = criticalCols.filter(col => colMap[col] === undefined);
  if (missingCols.length > 0) {
    console.warn(`   ⚠️  Missing columns: ${missingCols.join(', ')}`);
  }
  
  console.log(`   Column mapping:`, {
    unitNumber: colMap.unitNumber,
    client: colMap.client,
    salesRep: colMap.salesRep,
    status: colMap.status,
    price: colMap.price,
    downPayment: colMap.downPayment,
  });
  
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
      console.log(`   Stopped at row ${rowIdx} (summary section detected)`);
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
    
    // Skip available units
    if (statusStr.includes('disponible')) continue;
    
    // Skip if status indicates cancellation
    if (statusStr.includes('cancel') || statusStr.includes('desisti')) continue;
    
    const price = parseCurrency(getCellValue(row, colMap.price));
    const downPayment = parseCurrency(getCellValue(row, colMap.downPayment));
    
    // Skip if no price (critical field)
    if (price <= 0) {
      console.warn(`   ⚠️  Row ${rowIdx}: Unit ${unitNumber} has no valid price, skipping`);
      continue;
    }
    
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
          type: 'down_payment', // Will refine based on first payment
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
      referralName: null, // Not in current data
      referralApplies: false,
      promiseSignedDate: null, // Not easily extractable
      deedSignedDate: null,
      payments,
    });
  }
  
  console.log(`   ✅ Extracted ${sales.length} sales with ${sales.reduce((sum, s) => sum + s.payments.length, 0)} payments`);
  return sales;
}

async function loadToDatabase(sales: ExtractedSale[]) {
  console.log(`\n💾 Loading ${sales.length} sales to database...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const sale of sales) {
    try {
      // 1. Get or create project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('name', sale.project)
        .single();
      
      if (!project) {
        console.error(`Project not found: ${sale.project}`);
        errorCount++;
        continue;
      }
      
      // 2. Get or create client
      let clientId: string;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('full_name', sale.clientName)
        .maybeSingle();
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({ full_name: sale.clientName })
          .select('id')
          .single();
        
        if (error || !newClient) {
          console.error(`Failed to create client: ${sale.clientName}`, error);
          errorCount++;
          continue;
        }
        clientId = newClient.id;
      }
      
      // 3. Get or create unit
      let unitId: string;
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('project_id', project.id)
        .eq('unit_number', sale.unitNumber)
        .maybeSingle();
      
      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        const { data: newUnit, error } = await supabase
          .from('units')
          .insert({
            project_id: project.id,
            unit_number: sale.unitNumber,
            price_with_tax: sale.priceWithTax,
            price_without_tax: sale.priceWithoutTax,
            down_payment_amount: sale.downPayment,
            status: 'sold',
          })
          .select('id')
          .single();
        
        if (error || !newUnit) {
          console.error(`Failed to create unit: ${sale.unitNumber}`, error);
          errorCount++;
          continue;
        }
        unitId = newUnit.id;
      }
      
      // 4. Check if sale already exists
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
        const { data: newSale, error } = await supabase
          .from('sales')
          .insert({
            project_id: project.id,
            unit_id: unitId,
            client_id: clientId,
            sales_rep_id: sale.salesRep || 'unknown',
            sale_date: sale.reservationDate || new Date().toISOString().split('T')[0],
            price_with_tax: sale.priceWithTax,
            price_without_tax: sale.priceWithoutTax,
            down_payment_amount: sale.downPayment,
            financed_amount: sale.priceWithTax - sale.downPayment,
            referral_name: sale.referralName,
            referral_applies: sale.referralApplies,
            status: 'active',
            promise_signed_date: sale.promiseSignedDate,
            deed_signed_date: sale.deedSignedDate,
          })
          .select('id')
          .single();
        
        if (error || !newSale) {
          console.error(`Failed to create sale: ${sale.project} - ${sale.unitNumber}`, error);
          errorCount++;
          continue;
        }
        saleId = newSale.id;
        
        // 5. Create payments (will auto-trigger commission calculation)
        for (const payment of sale.payments) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              sale_id: saleId,
              payment_date: payment.date,
              amount: payment.amount,
              payment_type: payment.type,
              payment_method: 'cash', // Default
            });
          
          if (paymentError) {
            console.error(`Failed to create payment: ${payment.date}`, paymentError);
          }
        }
        
        console.log(`   ✅ Created: ${sale.project} - ${sale.unitNumber} (${sale.payments.length} payments)`);
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing sale: ${sale.project} - ${sale.unitNumber}`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} created, ${errorCount} errors`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 ETL: Reservas.xlsx → PostgreSQL\n');
  console.log(`Reading: ${EXCEL_PATH}`);
  
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`Sheets: ${workbook.SheetNames.length}`);
  
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

main().catch(console.error);

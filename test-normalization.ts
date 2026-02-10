#!/usr/bin/env node
/**
 * Test Script: Verify Unit Number Normalization Logic
 * Tests the tower code assignment for duplicates
 */

interface Sale {
  unitNumber: string;
  clientName: string;
}

// Simulate the normalization logic
function normalizeSales(sales: Sale[]): Sale[] {
  const unitNumberCounts = new Map<string, Array<{ index: number; hasCode: boolean }>>();
  
  sales.forEach((sale, index) => {
    const unitNum = sale.unitNumber;
    const baseUnit = unitNum.split('-')[0].trim();
    const hasCode = unitNum.includes('-');
    
    if (!unitNumberCounts.has(baseUnit)) {
      unitNumberCounts.set(baseUnit, []);
    }
    unitNumberCounts.get(baseUnit)!.push({ index, hasCode });
  });
  
  // Process duplicates
  unitNumberCounts.forEach((entries, baseUnit) => {
    if (entries.length > 1) {
      entries.forEach(({ index, hasCode }) => {
        if (!hasCode) {
          sales[index].unitNumber = `${baseUnit}-A`;
          console.log(`   🏢 Normalized: ${baseUnit} → ${baseUnit}-A`);
        }
      });
    }
  });
  
  return sales;
}

// Test cases
console.log('🧪 Testing Unit Number Normalization\n');

// Test 1: BENESTARE Unit 101 (3 sales, one without code)
console.log('Test 1: Unit 101 with duplicates');
console.log('─'.repeat(60));
let test1: Sale[] = [
  { unitNumber: '101-B', clientName: 'Wendy Azucena' },
  { unitNumber: '101-C', clientName: 'Allan Danilo' },
  { unitNumber: '101', clientName: 'Karen Arabella' },
];
console.log('Before:', test1.map(s => s.unitNumber).join(', '));
test1 = normalizeSales(test1);
console.log('After: ', test1.map(s => s.unitNumber).join(', '));
console.log('Expected: 101-B, 101-C, 101-A');
console.log('✅ Pass:', test1[2].unitNumber === '101-A' ? 'YES' : 'NO');
console.log();

// Test 2: BOULEVARD 5 Unit 101 (1 sale, no duplicates)
console.log('Test 2: Unit 101 without duplicates');
console.log('─'.repeat(60));
let test2: Sale[] = [
  { unitNumber: '101', clientName: 'Jose Franco' },
];
console.log('Before:', test2.map(s => s.unitNumber).join(', '));
test2 = normalizeSales(test2);
console.log('After: ', test2.map(s => s.unitNumber).join(', '));
console.log('Expected: 101 (no change)');
console.log('✅ Pass:', test2[0].unitNumber === '101' ? 'YES' : 'NO');
console.log();

// Test 3: BENESTARE Unit 305 (3 sales, all with codes)
console.log('Test 3: Unit 305 all with explicit codes');
console.log('─'.repeat(60));
let test3: Sale[] = [
  { unitNumber: '305-B', clientName: 'Dulce Rocio' },
  { unitNumber: '305-A', clientName: 'Andrea Yohana' },
  { unitNumber: '305-B', clientName: 'Angel Renato' },
];
console.log('Before:', test3.map(s => s.unitNumber).join(', '));
test3 = normalizeSales(test3);
console.log('After: ', test3.map(s => s.unitNumber).join(', '));
console.log('Expected: 305-B, 305-A, 305-B (no change, duplicate will error)');
console.log('✅ Pass:', test3[0].unitNumber === '305-B' && test3[2].unitNumber === '305-B' ? 'YES' : 'NO');
console.log('⚠️  Note: This will cause duplicate key error in DB (requires manual fix)');
console.log();

// Test 4: Mixed scenario
console.log('Test 4: Mixed units (some duplicates, some not)');
console.log('─'.repeat(60));
let test4: Sale[] = [
  { unitNumber: '101', clientName: 'Client A' },
  { unitNumber: '101-B', clientName: 'Client B' },
  { unitNumber: '102', clientName: 'Client C' },
  { unitNumber: '103-A', clientName: 'Client D' },
  { unitNumber: '103', clientName: 'Client E' },
];
console.log('Before:', test4.map(s => s.unitNumber).join(', '));
test4 = normalizeSales(test4);
console.log('After: ', test4.map(s => s.unitNumber).join(', '));
console.log('Expected: 101-A, 101-B, 102, 103-A, 103-A');
console.log('✅ Pass:', 
  test4[0].unitNumber === '101-A' && 
  test4[2].unitNumber === '102' && 
  test4[4].unitNumber === '103-A' ? 'YES' : 'NO'
);
console.log();

console.log('✅ All normalization tests complete');

const fs = require('fs');
const path = require('path');

console.log('=== IMPLEMENTATION REVIEW ===\n');

// Load car data
const data = require('../src/data/cars.json');
const cars = data.cars;

console.log(`Total cars: ${cars.length}\n`);

// Check data completeness for key fields
const fields = [
  'lengthInches',
  'bodyWidthInches',
  'mirrorsFoldedWidthInches',
  'mirrorWidthInches',
  'heightInches',
  'groundClearanceInches',
  'towingCapacityLbs',
  'cargoVolumesCuFt',
  'driverLegroomInches',
  'seats',
  'doors',
  'msrp',
  'safetyRating',
  'autonomousLevel',
  'fuelType',
  'mpgCombined',
  'electricRangeMiles'
];

console.log('Field coverage:');
fields.forEach(field => {
  const withField = cars.filter(c => c[field] !== undefined && c[field] !== null);
  const pct = ((withField.length / cars.length) * 100).toFixed(1);
  const status = pct === '100.0' ? '✓' : pct >= 80 ? '~' : '✗';
  console.log(`  ${status} ${field}: ${withField.length}/${cars.length} (${pct}%)`);
});

// Check for trucks without towing capacity
console.log('\n--- Potential Issues ---');

const trucksWithoutTowing = cars.filter(c => c.bodyType === 'truck' && !c.towingCapacityLbs);
if (trucksWithoutTowing.length > 0) {
  console.log(`\nTrucks missing towing capacity (${trucksWithoutTowing.length}):`);
  trucksWithoutTowing.forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}`));
}

const evsWithoutRange = cars.filter(c =>
  (c.fuelType === 'electric' || c.fuelType === 'plug-in-hybrid') && !c.electricRangeMiles
);
if (evsWithoutRange.length > 0) {
  console.log(`\nEVs/PHEVs missing electric range (${evsWithoutRange.length}):`);
  evsWithoutRange.slice(0, 10).forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}`));
  if (evsWithoutRange.length > 10) console.log(`  ... and ${evsWithoutRange.length - 10} more`);
}

const carsWithoutHeight = cars.filter(c => !c.heightInches);
if (carsWithoutHeight.length > 0) {
  console.log(`\nCars missing height (${carsWithoutHeight.length}):`);
  carsWithoutHeight.slice(0, 10).forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}`));
}

const carsWithoutClearance = cars.filter(c => !c.groundClearanceInches);
if (carsWithoutClearance.length > 0) {
  console.log(`\nCars missing ground clearance (${carsWithoutClearance.length}):`);
  carsWithoutClearance.slice(0, 10).forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}`));
}

// Check for unrealistic values
console.log('\n--- Value Sanity Checks ---');

const tooShort = cars.filter(c => c.lengthInches && c.lengthInches < 140);
if (tooShort.length > 0) {
  console.log(`\nSuspiciously short cars (<140"):`);
  tooShort.forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}: ${c.lengthInches}"`));
}

const tooLong = cars.filter(c => c.lengthInches && c.lengthInches > 250);
if (tooLong.length > 0) {
  console.log(`\nVery long vehicles (>250"):`);
  tooLong.forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}: ${c.lengthInches}"`));
}

const tooTall = cars.filter(c => c.heightInches && c.heightInches > 85);
if (tooTall.length > 0) {
  console.log(`\nVery tall vehicles (>85"):`);
  tooTall.forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}: ${c.heightInches}"`));
}

const extremeTowing = cars.filter(c => c.towingCapacityLbs && c.towingCapacityLbs > 15000);
if (extremeTowing.length > 0) {
  console.log(`\nHigh towing capacity (>15,000 lbs):`);
  extremeTowing.forEach(c => console.log(`  - ${c.year} ${c.make} ${c.model}: ${c.towingCapacityLbs} lbs`));
}

console.log('\n=== REVIEW COMPLETE ===');

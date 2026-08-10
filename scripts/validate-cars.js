const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'cars.json');
const typesPath = path.join(__dirname, '..', 'src', 'types', 'car.ts');
const data = require(dataPath);

// Enum members are read out of src/types/car.ts rather than restated here.
//
// This script used to have no enum check at all: it printed "van: 1" and "phev: 2" in
// its own summary while reporting zero issues, so eleven records that violated the
// declared unions shipped, and the affected cars silently vanished from the fuel and
// plug filters. `tsc` cannot catch them either, because page.tsx asserts the imported
// JSON with `as Car[]`. Parsing the union keeps this honest as the types evolve.
const typesSource = fs.readFileSync(typesPath, 'utf8');

function unionMembers(typeName) {
  const match = typesSource.match(new RegExp(`export type ${typeName}\\s*=\\s*([^;]+);`));
  if (!match) {
    throw new Error(`Could not find "export type ${typeName}" in ${typesPath}`);
  }
  const members = match[1].match(/"([^"]+)"/g);
  if (!members) {
    throw new Error(`No string literals found in the ${typeName} union`);
  }
  return members.map(m => m.slice(1, -1));
}

const ENUMS = {
  bodyType: unionMembers('BodyType'),
  fuelType: unionMembers('FuelType'),
  plugType: unionMembers('PlugType'),
  safetyRating: unionMembers('SafetyRating'),
  autonomousLevel: unionMembers('AutonomousLevel'),
  leaseRating: unionMembers('LeaseRating'),
  depreciationCategory: unionMembers('DepreciationCategory'),
  reliabilityRating: unionMembers('ReliabilityRating'),
};

// Fields the Car interface declares non-optional. Everything else is genuinely
// optional and its absence is not a defect — the previous list treated ~15 optional
// fields as mandatory and reported 701 "critical issues" against a schema-clean
// dataset, which trains a reader to ignore the tool.
const requiredFields = [
  'id',
  'year',
  'make',
  'model',
  'bodyType',
  'bodyWidthInches',
  'seats',
  'doors',
  'fuelType',
  'plugType',
  'lastUpdated',
];

// Fields that should be present based on fuel type
const fuelTypeFields = {
  'gasoline': ['mpgCity', 'mpgHighway', 'mpgCombined'],
  'hybrid': ['mpgCity', 'mpgHighway', 'mpgCombined'],
  'plug-in-hybrid': ['mpgCity', 'mpgHighway', 'mpgCombined', 'electricRangeMiles'],
  'electric': ['electricRangeMiles', 'mpge']
};

let issues = [];
let warnings = [];

const seenIds = new Map();
const seenVehicles = new Map();

data.cars.forEach((car) => {
  const carName = `${car.year} ${car.make} ${car.model} (${car.id || 'NO ID'})`;

  // Check required fields
  requiredFields.forEach(field => {
    if (car[field] === undefined || car[field] === null) {
      issues.push(`${carName}: Missing required field '${field}'`);
    }
  });

  // Every enum-typed field must name a member of its union.
  Object.entries(ENUMS).forEach(([field, allowed]) => {
    const value = car[field];
    if (value !== undefined && value !== null && !allowed.includes(value)) {
      issues.push(`${carName}: ${field} '${value}' is not one of ${allowed.join(' | ')}`);
    }
  });

  // Ids are referenced by share links, the saved baseline and the compare list.
  if (car.id) {
    if (seenIds.has(car.id)) {
      issues.push(`${carName}: duplicate id, also used by ${seenIds.get(car.id)}`);
    }
    seenIds.set(car.id, carName);
  }

  // Two records for the same real-world vehicle show up as indistinguishable rows
  // with conflicting specs, which undercuts the whole point of a comparison table.
  const vehicleKey = `${car.year}|${car.make}|${car.model}|${car.trim ?? ''}`.toLowerCase();
  if (seenVehicles.has(vehicleKey)) {
    warnings.push(`${carName}: same year/make/model/trim as ${seenVehicles.get(vehicleKey)}`);
  } else {
    seenVehicles.set(vehicleKey, carName);
  }

  // Check fuel-type specific fields
  const fuelType = car.fuelType;
  if (fuelType && fuelTypeFields[fuelType]) {
    fuelTypeFields[fuelType].forEach(field => {
      if (car[field] === undefined || car[field] === null) {
        warnings.push(`${carName}: Missing '${field}' for ${fuelType} vehicle`);
      }
    });
  }

  // Check for trucks - should have towing capacity
  if (car.bodyType === 'truck' && !car.towingCapacityLbs) {
    warnings.push(`${carName}: Truck missing towingCapacityLbs`);
  }

  // Check for invalid values. Classics are deliberately in the dataset, so the year
  // floor only flags implausible entries rather than everything before 2010.
  if (car.year && (car.year < 1900 || car.year > new Date().getFullYear() + 2)) {
    warnings.push(`${carName}: Year ${car.year} seems unusual`);
  }

  if (car.seats && (car.seats < 2 || car.seats > 9)) {
    warnings.push(`${carName}: Seats ${car.seats} seems unusual`);
  }

  // Check for plug type consistency with fuel type
  if (car.fuelType === 'electric' && car.plugType === 'none') {
    issues.push(`${carName}: Electric vehicle should have plugType set`);
  }

  if (car.fuelType === 'plug-in-hybrid' && car.plugType === 'none') {
    issues.push(`${carName}: PHEV should have plugType set`);
  }

  if (car.fuelType === 'gasoline' && car.plugType && car.plugType !== 'none') {
    issues.push(`${carName}: Gasoline vehicle should not have plugType '${car.plugType}'`);
  }
});

console.log('=== CAR DATA VALIDATION REPORT ===\n');
console.log(`Total cars: ${data.cars.length}\n`);

if (issues.length === 0) {
  console.log('✓ No critical issues found!\n');
} else {
  console.log(`✗ Found ${issues.length} critical issues:\n`);
  issues.forEach(issue => console.log('  - ' + issue));
  console.log('');
}

if (warnings.length === 0) {
  console.log('✓ No warnings!\n');
} else {
  console.log(`⚠ Found ${warnings.length} warnings:\n`);
  warnings.forEach(warning => console.log('  - ' + warning));
  console.log('');
}

// Summary by body type
const bodyTypes = {};
data.cars.forEach(car => {
  bodyTypes[car.bodyType] = (bodyTypes[car.bodyType] || 0) + 1;
});
console.log('Cars by body type:');
Object.entries(bodyTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Summary by fuel type
const fuelTypes = {};
data.cars.forEach(car => {
  fuelTypes[car.fuelType] = (fuelTypes[car.fuelType] || 0) + 1;
});
console.log('\nCars by fuel type:');
Object.entries(fuelTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Non-zero exit so CI fails on a schema violation instead of printing into the void.
if (issues.length > 0) {
  process.exitCode = 1;
}

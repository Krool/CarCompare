const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'cars.json');
const data = require(dataPath);

// Required fields that every car entry should have
const requiredFields = [
  'id',
  'year',
  'make',
  'model',
  'trim',
  'bodyType',
  'bodyWidthInches',
  'mirrorsFoldedWidthInches',
  'mirrorWidthInches',
  'lengthInches',
  'heightInches',
  'groundClearanceInches',
  'seats',
  'doors',
  'cargoVolumesCuFt',
  'fuelType',
  'plugType',
  'msrp',
  'safetyRating',
  'autonomousLevel',
  'adasName',
  'leaseRating',
  'depreciationCategory',
  'fiveYearResalePercent',
  'reliabilityRating',
  'insuranceCostAnnual',
  'maintenanceCostAnnual',
  'lastUpdated'
];

// Fields that should be present based on fuel type
const fuelTypeFields = {
  'gasoline': ['mpgCity', 'mpgHighway', 'mpgCombined'],
  'hybrid': ['mpgCity', 'mpgHighway', 'mpgCombined'],
  'plug-in-hybrid': ['mpgCity', 'mpgHighway', 'mpgCombined', 'electricRangeMiles'],
  'electric': ['electricRangeMiles', 'mpge']
};

// Optional but useful fields
const optionalFields = [
  'driverLegroomInches',
  'towingCapacityLbs',
  'payloadCapacityLbs',
  'wheelbaseLengthInches',
  'turningCircleFeet'
];

let issues = [];
let warnings = [];

data.cars.forEach((car, index) => {
  const carName = `${car.year} ${car.make} ${car.model} (${car.id || 'NO ID'})`;

  // Check required fields
  requiredFields.forEach(field => {
    if (car[field] === undefined || car[field] === null) {
      issues.push(`${carName}: Missing required field '${field}'`);
    }
  });

  // Check fuel-type specific fields
  const fuelType = car.fuelType;
  if (fuelType && fuelTypeFields[fuelType]) {
    fuelTypeFields[fuelType].forEach(field => {
      if (car[field] === undefined || car[field] === null) {
        issues.push(`${carName}: Missing '${field}' for ${fuelType} vehicle`);
      }
    });
  }

  // Check for trucks - should have towing capacity
  if (car.bodyType === 'truck' && !car.towingCapacityLbs) {
    warnings.push(`${carName}: Truck missing towingCapacityLbs`);
  }

  // Check for invalid values
  if (car.year && (car.year < 2010 || car.year > 2026)) {
    warnings.push(`${carName}: Year ${car.year} seems unusual`);
  }

  if (car.msrp && car.msrp < 10000) {
    warnings.push(`${carName}: MSRP $${car.msrp} seems too low`);
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

const fs = require('fs');
const data = require('../src/data/cars.json');

// Only process modern cars (2010+) - older cars don't have auto-folding mirrors
const MIN_YEAR = 2010;

// Brands that DEFINITELY have auto-folding mirrors on most/all models
const luxuryBrands = ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Porsche', 'Tesla', 'Rivian', 'Lucid', 'Polestar', 'Genesis', 'Volvo', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Land Rover', 'Jaguar', 'Maserati', 'Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Bentley', 'Rolls-Royce'];

// Japanese mainstream brands that DON'T have auto-folding in US market (except Acura/Lexus/Infiniti which are luxury)
const noAutoFoldBrands = ['Toyota', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Nissan'];

// Models that are exceptions (have auto-folding even from non-luxury brands)
const hasAutoFoldModels = [
  // Higher-end Hyundai/Kia typically have it
  { make: 'Hyundai', model: 'Palisade' },
  { make: 'Hyundai', model: 'Santa Fe' },
  { make: 'Hyundai', model: 'Ioniq 5' },
  { make: 'Hyundai', model: 'Ioniq 6' },
  { make: 'Kia', model: 'Telluride' },
  { make: 'Kia', model: 'EV6' },
  { make: 'Kia', model: 'EV9' },
  // GM higher trims
  { make: 'Chevrolet', model: 'Blazer EV' },
  { make: 'Chevrolet', model: 'Equinox EV' },
  { make: 'GMC', model: 'Hummer EV' },
  // Ford higher-end
  { make: 'Ford', model: 'Mustang Mach-E' },
  { make: 'Ford', model: 'F-150 Lightning' },
  // VW ID series
  { make: 'Volkswagen', model: 'ID.4' },
  { make: 'Volkswagen', model: 'ID.Buzz' },
  // Mini
  { make: 'MINI', model: 'Cooper SE' },
  { make: 'MINI', model: 'Countryman' },
];

// Models that definitely DON'T have it even if from a brand that might
const noAutoFoldModels = [
  { make: 'Hyundai', model: 'Elantra' },
  { make: 'Hyundai', model: 'Venue' },
  { make: 'Hyundai', model: 'Kona' },  // base models
  { make: 'Kia', model: 'Forte' },
  { make: 'Kia', model: 'Rio' },
  { make: 'Kia', model: 'Soul' },
  { make: 'Volkswagen', model: 'Jetta' },
  { make: 'Volkswagen', model: 'Taos' },
];

let updates = [];

data.cars.forEach(car => {
  // Skip vintage/classic cars - don't change their values
  if (car.year < MIN_YEAR) {
    return;
  }

  const isLuxury = luxuryBrands.includes(car.make);
  const isNoFoldBrand = noAutoFoldBrands.includes(car.make);
  const isExceptionHasFold = hasAutoFoldModels.some(m => m.make === car.make && m.model === car.model);
  const isExceptionNoFold = noAutoFoldModels.some(m => m.make === car.make && m.model === car.model);

  let shouldHaveAutoFold = null; // null means don't change

  if (isLuxury) {
    shouldHaveAutoFold = true;
  } else if (isNoFoldBrand) {
    shouldHaveAutoFold = false;
  } else if (isExceptionHasFold) {
    shouldHaveAutoFold = true;
  } else if (isExceptionNoFold) {
    shouldHaveAutoFold = false;
  }

  // Skip if we don't have a definitive answer
  if (shouldHaveAutoFold === null) {
    return;
  }

  // Initialize adasFeatures if not exists
  if (!car.adasFeatures) {
    car.adasFeatures = {};
  }

  const currentValue = car.adasFeatures.autoFoldingMirrors;

  // Update if different
  if (currentValue !== shouldHaveAutoFold) {
    updates.push({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      from: currentValue,
      to: shouldHaveAutoFold
    });
    car.adasFeatures.autoFoldingMirrors = shouldHaveAutoFold;
  }
});

console.log('Updates needed:', updates.length);
console.log('\nChanges:');
updates.forEach(u => {
  console.log(`${u.id}: ${u.from} -> ${u.to}`);
});

// Write updated data
fs.writeFileSync('./src/data/cars.json', JSON.stringify(data, null, 2));
console.log('\nData file updated!');

const fs = require('fs');
const path = require('path');

// Load current data
const dataPath = path.join(__dirname, '../src/data/cars.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`\n=== DATABASE AUDIT: ${data.cars.length} vehicles ===\n`);

// Required fields that should never be missing
const requiredFields = [
  'id', 'year', 'make', 'model', 'bodyType',
  'bodyWidthInches', 'seats', 'doors', 'fuelType', 'plugType',
  'lastUpdated', 'safetyRating', 'reviewScore', 'autonomousLevel'
];

// Optional but important fields
const importantFields = [
  'trim', 'mirrorWidthInches', 'mirrorsFoldedWidthInches',
  'lengthInches', 'heightInches', 'groundClearanceInches', 'towingCapacityLbs',
  'cargoVolumesCuFt', 'driverLegroomInches',
  'mpgCity', 'mpgHighway', 'mpgCombined', 'mpge', 'electricRangeMiles',
  'msrp', 'adasName', 'notes'
];

// Track issues
const missingRequired = {};
const missingImportant = {};
const issues = [];

data.cars.forEach(car => {
  const carId = `${car.year} ${car.make} ${car.model}`;

  // Check required fields
  requiredFields.forEach(field => {
    if (car[field] === undefined || car[field] === null) {
      if (!missingRequired[field]) missingRequired[field] = [];
      missingRequired[field].push(carId);
    }
  });

  // Check important fields
  importantFields.forEach(field => {
    if (car[field] === undefined || car[field] === null) {
      if (!missingImportant[field]) missingImportant[field] = [];
      missingImportant[field].push(carId);
    }
  });

  // Check for EVs without electric-specific data
  if (car.fuelType === 'electric') {
    if (!car.mpge) issues.push(`${carId}: EV missing mpge`);
    if (!car.electricRangeMiles) issues.push(`${carId}: EV missing electricRangeMiles`);
  }

  // Check for gas cars that should have MPG
  if (['gasoline', 'diesel', 'hybrid'].includes(car.fuelType)) {
    if (!car.mpgCombined) issues.push(`${carId}: Gas/Hybrid missing mpgCombined`);
  }

  // Check adasFeatures object exists
  if (!car.adasFeatures) {
    issues.push(`${carId}: Missing adasFeatures object`);
  }
});

// Report required field issues
console.log('=== REQUIRED FIELDS ===');
Object.keys(missingRequired).forEach(field => {
  console.log(`\n${field}: ${missingRequired[field].length} missing`);
  if (missingRequired[field].length <= 10) {
    missingRequired[field].forEach(car => console.log(`  - ${car}`));
  } else {
    missingRequired[field].slice(0, 5).forEach(car => console.log(`  - ${car}`));
    console.log(`  ... and ${missingRequired[field].length - 5} more`);
  }
});

if (Object.keys(missingRequired).length === 0) {
  console.log('All required fields present!');
}

// Report important field issues
console.log('\n\n=== IMPORTANT FIELDS (optional but should have) ===');
Object.keys(missingImportant).forEach(field => {
  const count = missingImportant[field].length;
  const percent = ((count / data.cars.length) * 100).toFixed(1);
  console.log(`${field}: ${count} missing (${percent}%)`);
});

// Report specific issues
if (issues.length > 0) {
  console.log('\n\n=== SPECIFIC ISSUES ===');
  issues.forEach(issue => console.log(`- ${issue}`));
}

// Summary stats
console.log('\n\n=== SUMMARY STATS ===');
const bodyTypes = {};
const fuelTypes = {};
const safetyRatings = {};
const autonomousLevels = {};
const years = {};

data.cars.forEach(car => {
  bodyTypes[car.bodyType] = (bodyTypes[car.bodyType] || 0) + 1;
  fuelTypes[car.fuelType] = (fuelTypes[car.fuelType] || 0) + 1;
  safetyRatings[car.safetyRating] = (safetyRatings[car.safetyRating] || 0) + 1;
  autonomousLevels[car.autonomousLevel] = (autonomousLevels[car.autonomousLevel] || 0) + 1;
  years[car.year] = (years[car.year] || 0) + 1;
});

console.log('\nBody Types:', bodyTypes);
console.log('\nFuel Types:', fuelTypes);
console.log('\nSafety Ratings:', safetyRatings);
console.log('\nAutonomous Levels:', autonomousLevels);
console.log('\nYears:', Object.keys(years).sort().map(y => `${y}:${years[y]}`).join(', '));

// Check score range
const scores = data.cars.map(c => c.reviewScore).filter(s => s !== undefined);
console.log(`\nReview Scores: min=${Math.min(...scores)}, max=${Math.max(...scores)}, count=${scores.length}`);

// Check seats range
const seats = data.cars.map(c => c.seats).filter(s => s !== undefined);
console.log(`Seats: min=${Math.min(...seats)}, max=${Math.max(...seats)}, values=${[...new Set(seats)].sort((a,b)=>a-b).join(', ')}`);

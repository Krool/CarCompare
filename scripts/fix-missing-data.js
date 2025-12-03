const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'cars.json');
const data = require(dataPath);

// Fixes for missing trim values
const trimFixes = {
  'cadillac-lyriq-2026': 'Tech',
  'chevrolet-bolt-ev-2026': '1LT',
  'nissan-leaf-2026': 'S Plus',
  'toyota-rav4-hybrid-2026': 'XLE',
  'toyota-rav4-prime-2026': 'SE',
  'jeep-wagoneer-s-2025': 'Launch Edition',
  'subaru-forester-hybrid-2025': 'Premium'
};

// Fixes for missing MPG data on RAV4 Prime
const mpgFixes = {
  'toyota-rav4-prime-2026': {
    mpgCity: 38,
    mpgHighway: 36,
    mpgCombined: 37
  }
};

let fixedCount = 0;

data.cars.forEach(car => {
  // Fix missing trims
  if (trimFixes[car.id] && !car.trim) {
    car.trim = trimFixes[car.id];
    console.log(`Fixed trim for ${car.year} ${car.make} ${car.model}: ${car.trim}`);
    fixedCount++;
  }

  // Fix missing MPG
  if (mpgFixes[car.id]) {
    const fixes = mpgFixes[car.id];
    Object.entries(fixes).forEach(([field, value]) => {
      if (!car[field]) {
        car[field] = value;
        console.log(`Fixed ${field} for ${car.year} ${car.make} ${car.model}: ${value}`);
        fixedCount++;
      }
    });
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixedCount} issues. Total cars: ${data.cars.length}`);

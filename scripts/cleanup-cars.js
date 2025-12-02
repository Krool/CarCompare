const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'cars.json');
const data = require(dataPath);
let cars = data.cars;

console.log('Starting with ' + cars.length + ' cars\n');

// === STEP 1: Remove exact duplicates ===
console.log('=== REMOVING EXACT DUPLICATES ===');
const seen = {};
const toRemove = [];

cars.forEach((c, idx) => {
  if (seen[c.id]) {
    const prev = seen[c.id];
    if (prev.trim === c.trim && prev.msrp === c.msrp) {
      console.log('Removing: ' + c.id);
      toRemove.push(idx);
    }
  } else {
    seen[c.id] = c;
  }
});

toRemove.sort((a, b) => b - a).forEach(idx => cars.splice(idx, 1));
console.log('Removed ' + toRemove.length + ' exact duplicates\n');

// === STEP 2: Fix duplicate IDs by adding trim suffix ===
console.log('=== FIXING DUPLICATE IDS ===');
const idCounts = {};
cars.forEach(c => idCounts[c.id] = (idCounts[c.id] || 0) + 1);
const duplicateIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);

duplicateIds.forEach(id => {
  const dupes = cars.filter(c => c.id === id);
  dupes.forEach((c, i) => {
    if (i > 0) {
      const trimSlug = (c.trim || 'variant-' + i).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newId = c.id + '-' + trimSlug;
      console.log('Renaming: ' + c.id + ' -> ' + newId);
      c.id = newId;
    }
  });
});

// === STEP 3: Fill in missing performance data for classic cars ===
console.log('\n=== FILLING MISSING PERFORMANCE DATA ===');

const performanceData = {
  'mclaren-f1-1995': { zeroToSixtySeconds: 3.2, horsepower: 618 },
  'mitsubishi-lancer-evolution-1995': { zeroToSixtySeconds: 5.2, horsepower: 276 },
  'mazda-rx7-1993': { zeroToSixtySeconds: 5.0, horsepower: 255 },
  'acura-nsx-1992': { zeroToSixtySeconds: 5.2, horsepower: 270 },
  'mazda-mx5-miata-1990': { zeroToSixtySeconds: 8.6, horsepower: 116 },
  'lamborghini-countach-1988': { zeroToSixtySeconds: 4.7, horsepower: 455 },
  'toyota-corolla-1985': { zeroToSixtySeconds: 10.5, horsepower: 112 },
  'toyota-land-cruiser-1985': { zeroToSixtySeconds: 14.0, horsepower: 155 },
  'plymouth-barracuda-1970': { zeroToSixtySeconds: 5.6, horsepower: 425 },
  'dodge-charger-1969': { zeroToSixtySeconds: 5.7, horsepower: 425 },
  'ford-mustang-1969': { zeroToSixtySeconds: 5.5, horsepower: 335 },
  'ford-mustang-shelby-1967': { zeroToSixtySeconds: 6.2, horsepower: 355 },
  'aston-martin-db5-1964': { zeroToSixtySeconds: 8.0, horsepower: 282 },
  'ferrari-250-gto-1962': { zeroToSixtySeconds: 6.1, horsepower: 300 }
};

Object.keys(performanceData).forEach(id => {
  const car = cars.find(c => c.id === id);
  if (car) {
    if (!car.zeroToSixtySeconds) {
      car.zeroToSixtySeconds = performanceData[id].zeroToSixtySeconds;
      console.log('Added 0-60 for ' + id + ': ' + car.zeroToSixtySeconds + 's');
    }
    if (!car.horsepower) {
      car.horsepower = performanceData[id].horsepower;
      console.log('Added HP for ' + id + ': ' + car.horsepower);
    }
  }
});

// === STEP 4: Fill in missing ownership data for classics (use N/A appropriate values) ===
console.log('\n=== FILLING MISSING OWNERSHIP DATA ===');

// For classic cars, set reasonable estimates based on collector car market
const classicOwnershipDefaults = {
  leaseRating: 'poor', // Classics aren't typically leased
  depreciationCategory: 'low', // Classics often appreciate
  fiveYearResalePercent: 95, // Classics hold value well
  reliabilityRating: 'below-average', // Older cars need more maintenance
  insuranceCostAnnual: 2000, // Collector car insurance is often cheaper
  maintenanceCostAnnual: 3000 // But maintenance is expensive
};

// Special cases for specific classics
const classicSpecificData = {
  'ferrari-250-gto-1962': { fiveYearResalePercent: 110, insuranceCostAnnual: 50000, maintenanceCostAnnual: 25000 },
  'mclaren-f1-1995': { fiveYearResalePercent: 115, insuranceCostAnnual: 30000, maintenanceCostAnnual: 20000 },
  'lamborghini-countach-1988': { fiveYearResalePercent: 105, insuranceCostAnnual: 8000, maintenanceCostAnnual: 8000 },
  'aston-martin-db5-1964': { fiveYearResalePercent: 108, insuranceCostAnnual: 5000, maintenanceCostAnnual: 6000 },
  'porsche-911-carrera-rs-1973': { fiveYearResalePercent: 110, insuranceCostAnnual: 4000, maintenanceCostAnnual: 5000 },
  'porsche-911-turbo-1986': { fiveYearResalePercent: 105, insuranceCostAnnual: 3000, maintenanceCostAnnual: 4000 },
  'nissan-skyline-gtr-1999': { fiveYearResalePercent: 102, insuranceCostAnnual: 2500, maintenanceCostAnnual: 3000 },
  'toyota-supra-1998': { fiveYearResalePercent: 105, insuranceCostAnnual: 2000, maintenanceCostAnnual: 2500 },
  'toyota-supra-1994': { fiveYearResalePercent: 108, insuranceCostAnnual: 2200, maintenanceCostAnnual: 2800 },
  'acura-nsx-1992': { fiveYearResalePercent: 105, insuranceCostAnnual: 2500, maintenanceCostAnnual: 3500 },
  'mazda-rx7-1993': { fiveYearResalePercent: 102, insuranceCostAnnual: 1800, maintenanceCostAnnual: 3000 },
  'bmw-m3-2001': { fiveYearResalePercent: 98, insuranceCostAnnual: 2000, maintenanceCostAnnual: 2500 },
  'honda-s2000-2000': { fiveYearResalePercent: 100, insuranceCostAnnual: 1500, maintenanceCostAnnual: 1500 },
  'nissan-silvia-2002': { fiveYearResalePercent: 100, insuranceCostAnnual: 1800, maintenanceCostAnnual: 2000 },
  'subaru-impreza-wrx-2004': { fiveYearResalePercent: 95, insuranceCostAnnual: 1800, maintenanceCostAnnual: 1800 },
  'nissan-gtr-2009': { fiveYearResalePercent: 90, insuranceCostAnnual: 2500, maintenanceCostAnnual: 3000 },
  'ford-gt-2005': { fiveYearResalePercent: 120, insuranceCostAnnual: 5000, maintenanceCostAnnual: 4000 },
  'mitsubishi-lancer-evolution-1995': { fiveYearResalePercent: 100, insuranceCostAnnual: 2000, maintenanceCostAnnual: 2500 },
  'mazda-mx5-miata-1990': { fiveYearResalePercent: 95, insuranceCostAnnual: 800, maintenanceCostAnnual: 1000 },
  'toyota-corolla-1985': { fiveYearResalePercent: 90, insuranceCostAnnual: 500, maintenanceCostAnnual: 800 },
  'toyota-land-cruiser-1985': { fiveYearResalePercent: 105, insuranceCostAnnual: 1000, maintenanceCostAnnual: 2000 },
  'ford-mustang-1969': { fiveYearResalePercent: 102, insuranceCostAnnual: 1500, maintenanceCostAnnual: 2500 },
  'ford-mustang-shelby-1967': { fiveYearResalePercent: 108, insuranceCostAnnual: 2500, maintenanceCostAnnual: 3500 },
  'dodge-charger-1969': { fiveYearResalePercent: 105, insuranceCostAnnual: 2000, maintenanceCostAnnual: 3000 },
  'plymouth-barracuda-1970': { fiveYearResalePercent: 105, insuranceCostAnnual: 2000, maintenanceCostAnnual: 3000 },
  'chevrolet-corvette-1963': { fiveYearResalePercent: 105, insuranceCostAnnual: 2500, maintenanceCostAnnual: 3000 },
  'toyota-rav4-2011': { leaseRating: 'poor', depreciationCategory: 'medium', fiveYearResalePercent: 55, reliabilityRating: 'good', insuranceCostAnnual: 1200, maintenanceCostAnnual: 600 }
};

cars.forEach(car => {
  if (!car.leaseRating) {
    const specific = classicSpecificData[car.id];
    car.leaseRating = specific?.leaseRating || classicOwnershipDefaults.leaseRating;
    car.depreciationCategory = specific?.depreciationCategory || classicOwnershipDefaults.depreciationCategory;
    car.fiveYearResalePercent = specific?.fiveYearResalePercent || classicOwnershipDefaults.fiveYearResalePercent;
    car.reliabilityRating = specific?.reliabilityRating || classicOwnershipDefaults.reliabilityRating;
    car.insuranceCostAnnual = specific?.insuranceCostAnnual || classicOwnershipDefaults.insuranceCostAnnual;
    car.maintenanceCostAnnual = specific?.maintenanceCostAnnual || classicOwnershipDefaults.maintenanceCostAnnual;
    console.log('Added ownership data for ' + car.id);
  }
});

// === STEP 5: Add adasName for cars with ADAS level "none" ===
console.log('\n=== SETTING ADAS NAME FOR CLASSICS ===');
cars.forEach(car => {
  if (!car.adasName && car.autonomousLevel === 'none') {
    car.adasName = 'None';
    console.log('Set adasName to None for ' + car.id);
  }
});

// === FINAL: Write the cleaned data ===
console.log('\n=== WRITING CLEANED DATA ===');
data.cars = cars;
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Saved ' + cars.length + ' cars to ' + dataPath);

const fs = require('fs');
const path = require('path');

// Load current data
const dataPath = path.join(__dirname, '../src/data/cars.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Depreciation/lease rules based on research:
// - Toyota/Lexus/Honda: Low depreciation, good leases
// - Trucks: Low-medium depreciation, good residuals
// - EVs: High-very high depreciation (except Tesla)
// - German luxury: High depreciation, fair leases
// - Korean brands: Medium depreciation, excellent leases (incentives)
// - Classic cars: N/A for depreciation

// Determine lease rating based on make and fuel type
function getLeaseRating(car) {
  const make = car.make.toLowerCase();
  const fuel = car.fuelType;
  const year = car.year;

  // Historical cars don't lease
  if (year < 2020) return null;

  // Excellent lease deals (aggressive incentives)
  if (['kia', 'hyundai'].includes(make)) return 'excellent';
  if (make === 'volkswagen') return 'excellent'; // Sign & Drive deals
  if (make === 'subaru' && fuel === 'electric') return 'excellent';
  if (make === 'chevrolet' && car.model === 'Trax') return 'excellent';

  // Good lease deals
  if (['toyota', 'honda', 'mazda', 'subaru'].includes(make)) return 'good';
  if (['ford', 'chevrolet', 'gmc'].includes(make) && car.bodyType === 'truck') return 'good';
  if (make === 'lexus') return 'good';
  if (make === 'acura') return 'good';

  // Fair lease deals
  if (['bmw', 'mercedes-benz', 'audi'].includes(make)) return 'fair';
  if (fuel === 'electric' && !['tesla', 'rivian'].includes(make)) return 'fair';
  if (['volvo', 'mini', 'fiat'].includes(make)) return 'fair';
  if (['cadillac', 'lincoln', 'genesis'].includes(make)) return 'fair';
  if (['chrysler', 'dodge', 'jeep', 'ram'].includes(make)) return 'fair';

  // Poor lease deals
  if (['lucid', 'polestar', 'fisker', 'vinfast'].includes(make)) return 'poor';
  if (make === 'gmc' && car.model === 'Hummer EV') return 'poor';
  if (['land rover', 'jaguar', 'maserati', 'alfa romeo'].includes(make)) return 'poor';

  // Default to fair
  return 'fair';
}

// Determine depreciation category
function getDepreciationCategory(car) {
  const make = car.make.toLowerCase();
  const fuel = car.fuelType;
  const body = car.bodyType;
  const year = car.year;

  // Historical cars - not applicable
  if (year < 2015) return null;

  // Low depreciation (retains 55%+ after 5 years)
  if (['toyota', 'lexus'].includes(make) && fuel !== 'electric') return 'low';
  if (make === 'honda' && fuel !== 'electric') return 'low';
  if (make === 'porsche') return 'low';
  if (body === 'truck' && ['toyota', 'ford', 'chevrolet', 'gmc', 'ram'].includes(make)) return 'low';
  if (make === 'subaru' && fuel !== 'electric') return 'low';
  if (make === 'jeep' && ['Wrangler', 'Grand Cherokee'].includes(car.model)) return 'low';

  // Medium depreciation (retains 45-54%)
  if (['mazda', 'hyundai', 'kia'].includes(make) && fuel !== 'electric') return 'medium';
  if (make === 'ford' && body !== 'truck') return 'medium';
  if (['acura', 'infiniti'].includes(make)) return 'medium';
  if (make === 'volkswagen' && fuel !== 'electric') return 'medium';
  if (make === 'tesla') return 'medium'; // Tesla holds better than other EVs
  if (make === 'rivian') return 'medium';

  // High depreciation (retains 35-44%)
  if (['bmw', 'mercedes-benz', 'audi'].includes(make) && fuel !== 'electric') return 'high';
  if (['volvo', 'genesis', 'lincoln'].includes(make)) return 'high';
  if (['chrysler', 'dodge'].includes(make)) return 'high';
  if (['mini', 'fiat'].includes(make)) return 'high';
  if (fuel === 'plug-in-hybrid') return 'high';
  if (make === 'honda' && fuel === 'electric') return 'medium'; // Prologue is new

  // Very high depreciation (retains <35%)
  if (fuel === 'electric' && !['tesla', 'rivian', 'honda'].includes(make)) return 'very-high';
  if (['lucid', 'polestar', 'fisker'].includes(make)) return 'very-high';
  if (['land rover', 'jaguar', 'maserati'].includes(make)) return 'very-high';
  if (make === 'gmc' && car.model === 'Hummer EV') return 'very-high';
  if (['bmw', 'mercedes-benz', 'audi', 'cadillac'].includes(make) && fuel === 'electric') return 'very-high';

  // Default to medium
  return 'medium';
}

// Get 5-year resale percentage
function getFiveYearResalePercent(car) {
  const make = car.make.toLowerCase();
  const fuel = car.fuelType;
  const body = car.bodyType;
  const year = car.year;

  // Historical cars - N/A
  if (year < 2015) return null;

  // Trucks hold value best
  if (body === 'truck') {
    if (['toyota'].includes(make)) return 62;
    if (['ford', 'chevrolet', 'gmc', 'ram'].includes(make)) return 55;
    if (['rivian'].includes(make)) return 48;
    return 52;
  }

  // Toyota/Lexus
  if (make === 'toyota' && fuel !== 'electric') return 58;
  if (make === 'lexus' && fuel !== 'electric') return 56;

  // Honda/Acura
  if (make === 'honda' && fuel !== 'electric') return 54;
  if (make === 'acura' && fuel !== 'electric') return 50;

  // Subaru
  if (make === 'subaru' && fuel !== 'electric') return 54;

  // Porsche
  if (make === 'porsche') return 58;

  // Mazda
  if (make === 'mazda') return 52;

  // Korean brands
  if (['hyundai', 'kia', 'genesis'].includes(make) && fuel !== 'electric') return 48;

  // Tesla
  if (make === 'tesla') return 50;

  // Rivian
  if (make === 'rivian') return 48;

  // German luxury gas
  if (['bmw', 'mercedes-benz', 'audi'].includes(make) && fuel !== 'electric') return 42;

  // American mainstream
  if (['ford', 'chevrolet', 'gmc'].includes(make) && fuel !== 'electric') return 46;

  // Stellantis brands
  if (['chrysler', 'dodge', 'jeep', 'ram'].includes(make)) return 44;

  // EVs (non-Tesla)
  if (fuel === 'electric') {
    if (['hyundai', 'kia'].includes(make)) return 42;
    if (['ford', 'chevrolet', 'gmc', 'cadillac'].includes(make)) return 38;
    if (['bmw', 'mercedes-benz', 'audi'].includes(make)) return 36;
    if (['volkswagen'].includes(make)) return 40;
    if (['lucid', 'polestar'].includes(make)) return 35;
    return 40;
  }

  // PHEVs
  if (fuel === 'plug-in-hybrid') return 42;

  // Hybrids
  if (fuel === 'hybrid') {
    if (['toyota', 'lexus', 'honda'].includes(make)) return 55;
    return 48;
  }

  // Default
  return 45;
}

// Update all cars
let updatedCount = 0;
data.cars.forEach(car => {
  const lease = getLeaseRating(car);
  const depreciation = getDepreciationCategory(car);
  const resale = getFiveYearResalePercent(car);

  // Only update if we don't already have data
  if (!car.leaseRating && lease) {
    car.leaseRating = lease;
    updatedCount++;
  }
  if (!car.depreciationCategory && depreciation) {
    car.depreciationCategory = depreciation;
  }
  if (!car.fiveYearResalePercent && resale) {
    car.fiveYearResalePercent = resale;
  }
});

// Count how many have data now
const withLease = data.cars.filter(c => c.leaseRating).length;
const withDeprec = data.cars.filter(c => c.depreciationCategory).length;
const withResale = data.cars.filter(c => c.fiveYearResalePercent).length;

console.log(`Updated ${updatedCount} cars`);
console.log(`Cars with lease rating: ${withLease}/${data.cars.length}`);
console.log(`Cars with depreciation: ${withDeprec}/${data.cars.length}`);
console.log(`Cars with resale %: ${withResale}/${data.cars.length}`);

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\nData saved successfully!');

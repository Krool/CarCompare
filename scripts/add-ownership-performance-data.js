const fs = require('fs');
const path = require('path');

// Load current data
const dataPath = path.join(__dirname, '../src/data/cars.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Reliability rating based on JD Power / Consumer Reports data
function getReliabilityRating(car) {
  const make = car.make.toLowerCase();
  const year = car.year;

  // Historical cars - not rated
  if (year < 2018) return null;

  // Top tier reliability (Lexus, Toyota, Buick, Honda)
  if (['lexus'].includes(make)) return 'excellent';
  if (['toyota', 'buick'].includes(make) && car.fuelType !== 'electric') return 'excellent';
  if (['honda', 'acura'].includes(make) && car.fuelType !== 'electric') return 'good';

  // Good reliability
  if (['mazda', 'subaru', 'hyundai', 'kia', 'genesis'].includes(make) && car.fuelType !== 'electric') return 'good';
  if (make === 'chevrolet' && car.fuelType !== 'electric') return 'good';
  if (make === 'cadillac' && car.fuelType !== 'electric') return 'good';
  if (make === 'porsche') return 'good';

  // Average reliability
  if (['ford', 'gmc', 'nissan', 'mitsubishi'].includes(make)) return 'average';
  if (['bmw', 'mercedes-benz', 'audi'].includes(make) && car.fuelType !== 'electric') return 'average';
  if (['volvo', 'lincoln'].includes(make)) return 'average';
  if (make === 'tesla') return 'average'; // Software issues but EV drivetrain reliable
  if (make === 'rivian') return 'average';

  // Below average
  if (['volkswagen', 'chrysler', 'dodge', 'ram'].includes(make)) return 'below-average';
  if (['jeep'].includes(make) && !['Wrangler'].includes(car.model)) return 'below-average';
  if (['land rover', 'jaguar', 'alfa romeo', 'maserati'].includes(make)) return 'below-average';

  // Poor reliability (new EVs from less experienced makers, problematic brands)
  if (['lucid', 'polestar', 'fisker', 'vinfast'].includes(make)) return 'poor';
  if (car.fuelType === 'electric' && ['chevrolet', 'cadillac', 'gmc', 'ford'].includes(make)) return 'below-average';

  return 'average';
}

// Insurance cost based on vehicle type, value, and brand
function getInsuranceCost(car) {
  const make = car.make.toLowerCase();
  const msrp = car.msrp || 35000;
  const body = car.bodyType;
  const fuel = car.fuelType;
  const year = car.year;

  // Historical cars - different insurance considerations
  if (year < 2015) return { category: null, annual: null };

  let baseCost = 2300; // National average

  // Adjust by MSRP
  if (msrp > 100000) baseCost *= 1.8;
  else if (msrp > 70000) baseCost *= 1.5;
  else if (msrp > 50000) baseCost *= 1.3;
  else if (msrp > 35000) baseCost *= 1.1;
  else if (msrp < 25000) baseCost *= 0.85;

  // Adjust by body type
  if (body === 'coupe' || body === 'sports') baseCost *= 1.4;
  if (body === 'minivan') baseCost *= 0.85;
  if (body === 'sedan') baseCost *= 0.95;

  // Adjust by brand
  if (['ferrari', 'lamborghini', 'mclaren', 'aston martin', 'porsche'].includes(make)) baseCost *= 2.0;
  if (['bmw', 'mercedes-benz', 'audi', 'land rover', 'jaguar'].includes(make)) baseCost *= 1.3;
  if (['tesla'].includes(make)) baseCost *= 1.5; // Tesla insurance notoriously high
  if (['rivian', 'lucid'].includes(make)) baseCost *= 1.4;
  if (['honda', 'toyota', 'subaru', 'mazda'].includes(make)) baseCost *= 0.9;
  if (['hyundai', 'kia'].includes(make)) baseCost *= 0.95;

  // EVs generally cost more to insure
  if (fuel === 'electric') baseCost *= 1.15;

  const annual = Math.round(baseCost / 100) * 100;

  let category;
  if (annual < 2000) category = 'low';
  else if (annual < 2800) category = 'average';
  else if (annual < 4000) category = 'high';
  else category = 'very-high';

  return { category, annual };
}

// Maintenance cost based on brand and complexity
function getMaintenanceCost(car) {
  const make = car.make.toLowerCase();
  const fuel = car.fuelType;
  const year = car.year;

  if (year < 2015) return { category: null, annual: null };

  let baseCost = 900; // Average annual maintenance

  // EVs have lower maintenance
  if (fuel === 'electric') baseCost = 600;
  if (fuel === 'hybrid' || fuel === 'plug-in-hybrid') baseCost = 750;

  // Brand adjustments
  if (['porsche', 'ferrari', 'lamborghini', 'mclaren', 'aston martin'].includes(make)) baseCost *= 2.5;
  if (['bmw', 'mercedes-benz', 'audi', 'land rover', 'jaguar'].includes(make)) baseCost *= 1.6;
  if (['lexus', 'acura', 'infiniti', 'genesis'].includes(make)) baseCost *= 1.2;
  if (['volvo', 'mini', 'alfa romeo', 'maserati'].includes(make)) baseCost *= 1.5;
  if (['honda', 'toyota', 'mazda'].includes(make)) baseCost *= 0.7;
  if (['hyundai', 'kia', 'subaru'].includes(make)) baseCost *= 0.85;
  if (['ford', 'chevrolet', 'gmc', 'dodge', 'jeep', 'ram', 'chrysler'].includes(make)) baseCost *= 1.0;
  if (['nissan', 'mitsubishi'].includes(make)) baseCost *= 0.9;
  if (['tesla', 'rivian'].includes(make)) baseCost *= 0.7; // EV simplicity

  const annual = Math.round(baseCost / 50) * 50;

  let category;
  if (annual < 700) category = 'low';
  else if (annual < 1100) category = 'average';
  else if (annual < 1500) category = 'high';
  else category = 'very-high';

  return { category, annual };
}

// 0-60 times and horsepower estimates
function getPerformanceData(car) {
  const make = car.make.toLowerCase();
  const body = car.bodyType;
  const fuel = car.fuelType;
  const msrp = car.msrp || 35000;
  const year = car.year;

  // Historical performance cars - special handling
  if (year < 2000) {
    // Classic cars
    if (make === 'ford' && car.model.includes('Boss')) return { hp: 375, torque: 450, zeroSixty: 5.8 };
    if (make === 'toyota' && car.model.includes('Supra')) return { hp: 320, torque: 315, zeroSixty: 4.6 };
    if (make === 'nissan' && car.model.includes('GT-R')) return { hp: 276, torque: 293, zeroSixty: 4.9 };
    if (make === 'chevrolet' && car.model.includes('Corvette')) return { hp: 405, torque: 400, zeroSixty: 4.5 };
    if (make === 'porsche' && car.model.includes('911')) return { hp: 296, torque: 258, zeroSixty: 4.6 };
    if (make === 'dodge' && car.model.includes('Viper')) return { hp: 450, torque: 490, zeroSixty: 4.0 };
    if (make === 'plymouth' && car.model.includes('Cuda')) return { hp: 425, torque: 490, zeroSixty: 5.6 };
    return { hp: null, torque: null, zeroSixty: null };
  }

  // Modern performance estimates by category
  let hp, torque, zeroSixty;

  // Electric vehicles - instant torque
  if (fuel === 'electric') {
    if (['tesla'].includes(make)) {
      if (car.model.includes('Model S') || car.model.includes('Model X')) {
        hp = 670; torque = 713; zeroSixty = 3.1;
      } else if (car.model.includes('Model 3') || car.model.includes('Model Y')) {
        hp = 346; torque = 389; zeroSixty = 4.8;
      } else {
        hp = 250; torque = 310; zeroSixty = 5.9;
      }
    } else if (['rivian'].includes(make)) {
      hp = 835; torque = 908; zeroSixty = 3.0;
    } else if (['lucid'].includes(make)) {
      hp = 620; torque = 620; zeroSixty = 3.0;
    } else if (['porsche'].includes(make)) {
      hp = 402; torque = 254; zeroSixty = 4.8;
    } else if (['bmw'].includes(make)) {
      hp = 335; torque = 317; zeroSixty = 5.3;
    } else if (['hyundai', 'kia', 'genesis'].includes(make)) {
      if (car.model.includes('EV9') || car.model.includes('EV6') || car.model.includes('Ioniq 5')) {
        hp = 320; torque = 446; zeroSixty = 5.1;
      } else {
        hp = 225; torque = 258; zeroSixty = 7.5;
      }
    } else if (['ford'].includes(make) && car.model.includes('Mustang Mach-E')) {
      hp = 346; torque = 428; zeroSixty = 5.2;
    } else if (['chevrolet'].includes(make)) {
      if (car.model.includes('Silverado')) {
        hp = 664; torque = 780; zeroSixty = 4.5;
      } else {
        hp = 288; torque = 333; zeroSixty = 6.5;
      }
    } else if (['volkswagen'].includes(make)) {
      hp = 282; torque = 406; zeroSixty = 5.7;
    } else if (['cadillac'].includes(make)) {
      hp = 340; torque = 325; zeroSixty = 5.8;
    } else if (['gmc'].includes(make) && car.model.includes('Hummer')) {
      hp = 1000; torque = 1200; zeroSixty = 3.0;
    } else {
      hp = 250; torque = 280; zeroSixty = 7.0;
    }
    return { hp, torque, zeroSixty };
  }

  // Sports cars
  if (body === 'coupe' || (car.model && (car.model.includes('GR86') || car.model.includes('BRZ') || car.model.includes('Miata') || car.model.includes('Mustang') || car.model.includes('Camaro') || car.model.includes('Corvette') || car.model.includes('911') || car.model.includes('Supra')))) {
    if (['ferrari', 'lamborghini', 'mclaren'].includes(make)) {
      hp = 660; torque = 560; zeroSixty = 2.9;
    } else if (make === 'porsche') {
      hp = 379; torque = 331; zeroSixty = 4.0;
    } else if (make === 'chevrolet' && car.model.includes('Corvette')) {
      hp = 495; torque = 470; zeroSixty = 2.9;
    } else if (['ford', 'chevrolet', 'dodge'].includes(make)) {
      hp = 480; torque = 420; zeroSixty = 4.2;
    } else if (make === 'toyota' && car.model.includes('Supra')) {
      hp = 382; torque = 368; zeroSixty = 3.9;
    } else if (car.model && (car.model.includes('GR86') || car.model.includes('BRZ'))) {
      hp = 228; torque = 184; zeroSixty = 6.1;
    } else if (car.model && car.model.includes('Miata')) {
      hp = 181; torque = 151; zeroSixty = 5.8;
    } else {
      hp = 300; torque = 280; zeroSixty = 5.5;
    }
    return { hp, torque, zeroSixty };
  }

  // Trucks
  if (body === 'truck') {
    if (car.model && car.model.includes('Raptor')) {
      hp = 450; torque = 510; zeroSixty = 5.2;
    } else if (make === 'ford') {
      hp = 400; torque = 410; zeroSixty = 6.0;
    } else if (make === 'ram') {
      hp = 395; torque = 410; zeroSixty = 6.3;
    } else if (['chevrolet', 'gmc'].includes(make)) {
      hp = 355; torque = 383; zeroSixty = 6.5;
    } else if (make === 'toyota') {
      hp = 278; torque = 265; zeroSixty = 6.8;
    } else if (make === 'rivian') {
      hp = 835; torque = 908; zeroSixty = 3.0;
    } else if (make === 'hyundai' || make === 'ford' && car.model.includes('Maverick')) {
      hp = 191; torque = 155; zeroSixty = 8.5;
    } else {
      hp = 280; torque = 275; zeroSixty = 7.0;
    }
    return { hp, torque, zeroSixty };
  }

  // SUVs and Crossovers
  if (body === 'suv' || body === 'crossover') {
    if (msrp > 80000) {
      hp = 400; torque = 420; zeroSixty = 4.5;
    } else if (msrp > 50000) {
      hp = 300; torque = 310; zeroSixty = 6.0;
    } else if (msrp > 35000) {
      hp = 250; torque = 260; zeroSixty = 7.0;
    } else {
      hp = 180; torque = 175; zeroSixty = 8.5;
    }

    // Brand adjustments
    if (['porsche', 'bmw', 'mercedes-benz', 'audi'].includes(make) && msrp > 60000) {
      hp = 450; torque = 480; zeroSixty = 4.2;
    }
    if (fuel === 'hybrid') {
      hp += 50; zeroSixty -= 0.5;
    }
    return { hp, torque, zeroSixty };
  }

  // Minivans
  if (body === 'minivan') {
    hp = 280; torque = 262; zeroSixty = 7.2;
    return { hp, torque, zeroSixty };
  }

  // Sedans and hatchbacks
  if (body === 'sedan' || body === 'hatchback' || body === 'wagon') {
    if (msrp > 60000) {
      hp = 335; torque = 330; zeroSixty = 4.8;
    } else if (msrp > 35000) {
      hp = 200; torque = 190; zeroSixty = 6.8;
    } else {
      hp = 158; torque = 138; zeroSixty = 8.5;
    }

    // Hybrid boost
    if (fuel === 'hybrid') {
      hp += 30; zeroSixty -= 0.5;
    }
    return { hp, torque, zeroSixty };
  }

  return { hp: 200, torque: 185, zeroSixty: 7.5 };
}

// Update all cars
let updated = 0;
data.cars.forEach(car => {
  // Reliability
  if (!car.reliabilityRating) {
    const reliability = getReliabilityRating(car);
    if (reliability) {
      car.reliabilityRating = reliability;
      updated++;
    }
  }

  // Insurance
  if (!car.insuranceCostCategory) {
    const insurance = getInsuranceCost(car);
    if (insurance.category) {
      car.insuranceCostCategory = insurance.category;
      car.insuranceCostAnnual = insurance.annual;
    }
  }

  // Maintenance
  if (!car.maintenanceCostCategory) {
    const maintenance = getMaintenanceCost(car);
    if (maintenance.category) {
      car.maintenanceCostCategory = maintenance.category;
      car.maintenanceCostAnnual = maintenance.annual;
    }
  }

  // Performance
  if (!car.zeroToSixtySeconds) {
    const perf = getPerformanceData(car);
    if (perf.zeroSixty) {
      car.zeroToSixtySeconds = perf.zeroSixty;
      car.horsepower = perf.hp;
      car.torqueLbFt = perf.torque;
    }
  }
});

// Summary
const withReliability = data.cars.filter(c => c.reliabilityRating).length;
const withInsurance = data.cars.filter(c => c.insuranceCostAnnual).length;
const withMaintenance = data.cars.filter(c => c.maintenanceCostAnnual).length;
const withPerformance = data.cars.filter(c => c.zeroToSixtySeconds).length;

console.log(`Updated ${updated} cars`);
console.log(`Reliability: ${withReliability}/${data.cars.length}`);
console.log(`Insurance: ${withInsurance}/${data.cars.length}`);
console.log(`Maintenance: ${withMaintenance}/${data.cars.length}`);
console.log(`Performance (0-60): ${withPerformance}/${data.cars.length}`);

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\nData saved!');

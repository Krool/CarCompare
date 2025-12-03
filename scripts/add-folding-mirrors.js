const fs = require('fs');
const path = require('path');

// Load car data
const dataPath = path.join(__dirname, '../src/data/cars.json');
const data = require(dataPath);

// Auto-folding mirrors availability by make/model
// true = standard or widely available
// false = not available or very rare option
const foldingMirrorsMap = {
  // Acura - standard on most models
  'Acura MDX': true,
  'Acura NSX': true,
  'Acura RDX': true,
  'Acura ZDX': true,

  // Aston Martin - standard
  'Aston Martin DB5': false, // Classic car

  // Audi - standard on most
  'Audi A4 Allroad': true,
  'Audi A6': true,
  'Audi Q4 e-tron': true,
  'Audi Q5': true,
  'Audi Q6 e-tron': true,
  'Audi Q7': true,
  'Audi Q8 e-tron': true,

  // BMW - standard
  'BMW M3': true,
  'BMW X3': true,
  'BMW X5': true,
  'BMW i4': true,
  'BMW i5': true,
  'BMW iX': true,

  // Buick - available on higher trims
  'Buick Enclave': true,
  'Buick Encore GX': true,
  'Buick Envision': true,

  // Cadillac - standard
  'Cadillac Lyriq': true,

  // Chevrolet - varies by model
  'Chevrolet Blazer EV': true,
  'Chevrolet Bolt EV': false,
  'Chevrolet Camaro': true, // On higher trims
  'Chevrolet Colorado': false,
  'Chevrolet Corvette': true,
  'Chevrolet Equinox': false,
  'Chevrolet Equinox EV': true,
  'Chevrolet Silverado 1500': true, // On higher trims
  'Chevrolet Traverse': true,
  'Chevrolet Trax': false,

  // Chrysler
  'Chrysler Pacifica': true,
  'Chrysler Pacifica Hybrid': true,

  // Dodge
  'Dodge Charger': true,
  'Dodge Hornet': true,

  // Ferrari - standard
  'Ferrari 250 GTO': false, // Classic car

  // Fiat
  'Fiat 500e': false,

  // Ford - varies
  'Ford Bronco Sport': false,
  'Ford Edge': true,
  'Ford Escape': false,
  'Ford Explorer': true,
  'Ford F-150': true, // On higher trims
  'Ford GT': true,
  'Ford Maverick': false,
  'Ford Mustang': true,
  'Ford Mustang Mach-E': true,
  'Ford Mustang Shelby': true,
  'Ford Ranger': false,

  // GMC
  'GMC Acadia': true,
  'GMC Hummer EV': true,
  'GMC Sierra 1500': true,
  'GMC Terrain': true,

  // Genesis - standard
  'Genesis Electrified GV70': true,
  'Genesis GV70': true,

  // Honda - varies
  'Honda Accord': true, // On Touring
  'Honda CR-V': true, // On higher trims
  'Honda CR-V Hybrid': true,
  'Honda Civic': false,
  'Honda Civic Hatchback': false,
  'Honda HR-V': false,
  'Honda Odyssey': true,
  'Honda Pilot': true,
  'Honda Prologue': true,
  'Honda Ridgeline': true,
  'Honda S2000': false, // Classic

  // Hyundai - varies
  'Hyundai Elantra': false,
  'Hyundai Elantra N': true,
  'Hyundai Ioniq 5': true,
  'Hyundai Ioniq 6': true,
  'Hyundai Palisade': true,
  'Hyundai Santa Cruz': true,
  'Hyundai Santa Fe': true,
  'Hyundai Sonata': true,
  'Hyundai Tucson': true,

  // Infiniti - standard
  'Infiniti QX60': true,
  'Infiniti QX80': true,

  // Jaguar - standard
  'Jaguar I-PACE': true,

  // Jeep - varies
  'Jeep Compass': false,
  'Jeep Grand Cherokee': true,
  'Jeep Grand Cherokee 4xe': true,
  'Jeep Wagoneer S': true,
  'Jeep Wrangler': false, // Manual fold

  // Kia - varies
  'Kia Carnival': true,
  'Kia EV6': true,
  'Kia EV9': true,
  'Kia Forte': false,
  'Kia K5': true,
  'Kia Niro EV': true,
  'Kia Optima': true,
  'Kia Rio': false,
  'Kia Sorento': true,
  'Kia Sportage': true,
  'Kia Telluride': true,

  // Lamborghini - standard
  'Lamborghini Countach': false, // Classic

  // Land Rover - standard
  'Land Rover Defender': true,
  'Land Rover Range Rover': true,

  // Lexus - standard
  'Lexus GX': true,
  'Lexus LX': true,
  'Lexus NX': true,
  'Lexus RX': true,
  'Lexus RX Hybrid': true,
  'Lexus RZ': true,
  'Lexus TX': true,

  // Lincoln - standard
  'Lincoln Aviator': true,
  'Lincoln Nautilus': true,

  // Lucid - standard
  'Lucid Air': true,
  'Lucid Gravity': true,

  // Mazda - varies
  'Mazda CX-5': true, // On higher trims
  'Mazda CX-50': true,
  'Mazda CX-70': true,
  'Mazda CX-90': true,
  'Mazda MX-5 Miata': false,
  'Mazda Mazda3': true, // On premium
  'Mazda Mazda3 Hatchback': true,
  'Mazda RX-7': false, // Classic

  // McLaren - standard
  'McLaren F1': false, // Classic

  // Mercedes - standard
  'Mercedes-Benz EQE': true,
  'Mercedes-Benz EQE SUV': true,
  'Mercedes-Benz EQS SUV': true,
  'Mercedes-Benz GLC': true,
  'Mercedes-Benz GLE': true,
  'Mercedes-Benz S-Class': true,

  // Mini - varies
  'Mini Cooper SE': true,
  'Mini Countryman': true,

  // Mitsubishi
  'Mitsubishi Lancer Evolution': false, // Classic
  'Mitsubishi Mirage': false,
  'Mitsubishi Outlander': true,
  'Mitsubishi Outlander PHEV': true,

  // Nissan - varies
  'Nissan Altima': true,
  'Nissan Ariya': true,
  'Nissan GT-R': true,
  'Nissan Leaf': true,
  'Nissan Murano': true,
  'Nissan Pathfinder': true,
  'Nissan Rogue': true,
  'Nissan Sentra': false,
  'Nissan Silvia': false, // Classic
  'Nissan Skyline GT-R': false, // Classic
  'Nissan Versa': false,
  'Nissan Z': true,

  // Plymouth - classic
  'Plymouth Barracuda': false,

  // Polestar - standard
  'Polestar 2': true,
  'Polestar 3': true,

  // Porsche - standard
  'Porsche 911 Carrera RS': false, // Classic
  'Porsche 911 Turbo': true,
  'Porsche Cayenne': true,
  'Porsche Macan Electric': true,
  'Porsche Taycan': true,

  // RAM
  'RAM 1500': true, // On higher trims

  // Rivian - standard
  'Rivian R1S': true,
  'Rivian R1T': true,
  'Rivian R2': true,

  // Subaru - varies
  'Subaru BRZ': false,
  'Subaru Crosstrek': false,
  'Subaru Forester': true, // On Touring
  'Subaru Forester Hybrid': true,
  'Subaru Impreza WRX': false, // Classic
  'Subaru Legacy': true,
  'Subaru Outback': true,
  'Subaru Solterra': true,

  // Tesla - standard (auto-fold)
  'Tesla Cybertruck': true,
  'Tesla Model 3': true,
  'Tesla Model S': true,
  'Tesla Model X': true,
  'Tesla Model Y': true,

  // Toyota - varies
  'Toyota 4Runner': true,
  'Toyota Camry': true, // On higher trims
  'Toyota Corolla': false,
  'Toyota Crown': true,
  'Toyota GR86': false,
  'Toyota Grand Highlander': true,
  'Toyota Highlander': true,
  'Toyota Land Cruiser': true,
  'Toyota RAV4': true, // On higher trims
  'Toyota RAV4 Hybrid': true,
  'Toyota RAV4 Prime': true,
  'Toyota Sequoia': true,
  'Toyota Sienna': true,
  'Toyota Supra': true,
  'Toyota Tacoma': false,
  'Toyota Tundra': true,
  'Toyota bZ4X': true,

  // Volkswagen - varies
  'Volkswagen Atlas': true,
  'Volkswagen Golf GTI': true,
  'Volkswagen ID. Buzz': true,
  'Volkswagen ID.4': true,
  'Volkswagen Jetta': false,
  'Volkswagen Taos': false,
  'Volkswagen Tiguan': true,

  // Volvo - standard
  'Volvo EX90': true,
  'Volvo V60 Cross Country': true,
  'Volvo XC60': true,
  'Volvo XC90': true,
};

// Update each car
let updated = 0;
data.cars.forEach(car => {
  const key = `${car.make} ${car.model}`;
  const hasFolding = foldingMirrorsMap[key];

  if (hasFolding !== undefined) {
    if (!car.adasFeatures) {
      car.adasFeatures = {};
    }
    car.adasFeatures.autoFoldingMirrors = hasFolding;
    updated++;
  } else {
    console.log(`Missing mapping for: ${key}`);
  }
});

console.log(`Updated ${updated} cars with auto-folding mirror data`);

// Count by value
const withFolding = data.cars.filter(c => c.adasFeatures?.autoFoldingMirrors === true).length;
const withoutFolding = data.cars.filter(c => c.adasFeatures?.autoFoldingMirrors === false).length;
console.log(`With auto-folding mirrors: ${withFolding}`);
console.log(`Without auto-folding mirrors: ${withoutFolding}`);

// Write back
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Data saved!');

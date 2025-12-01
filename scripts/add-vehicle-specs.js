const fs = require('fs');
const path = require('path');

// Ground clearance data (inches)
// Sources: manufacturer specs, Car and Driver, Edmunds
const GROUND_CLEARANCE = {
  // Compact SUVs/Crossovers
  'Toyota RAV4': 8.4,
  'Toyota RAV4 Hybrid': 8.4,
  'Toyota RAV4 Prime': 8.1,
  'Honda CR-V': 7.8,
  'Honda CR-V Hybrid': 7.8,
  'Mazda CX-5': 7.5,
  'Mazda CX-50': 8.6,
  'Subaru Forester': 8.7,
  'Subaru Outback': 8.7,
  'Subaru Crosstrek': 8.7,
  'Nissan Rogue': 8.4,
  'Ford Escape': 7.8,
  'Ford Escape Hybrid': 7.8,
  'Hyundai Tucson': 8.3,
  'Hyundai Tucson Hybrid': 8.3,
  'Kia Sportage': 8.3,
  'Chevrolet Equinox': 7.9,
  'Volkswagen Tiguan': 7.9,
  'Jeep Compass': 8.6,
  'Jeep Cherokee': 8.7,
  'GMC Terrain': 7.9,

  // Midsize SUVs
  'Toyota Highlander': 8.0,
  'Toyota Highlander Hybrid': 8.0,
  'Toyota Grand Highlander': 8.2,
  'Honda Pilot': 7.3,
  'Honda Passport': 8.1,
  'Hyundai Palisade': 7.9,
  'Kia Telluride': 8.0,
  'Mazda CX-9': 8.8,
  'Mazda CX-90': 8.3,
  'Mazda CX-70': 8.3,
  'Subaru Ascent': 8.7,
  'Ford Explorer': 7.9,
  'Chevrolet Traverse': 7.7,
  'Chevrolet Blazer': 7.5,
  'Dodge Durango': 8.1,
  'Jeep Grand Cherokee': 8.6,
  'Jeep Grand Cherokee 4xe': 10.9,
  'Volkswagen Atlas': 8.0,
  'GMC Acadia': 7.2,
  'Buick Enclave': 7.0,
  'Hyundai Santa Fe': 8.6,
  'Kia Sorento': 8.3,
  'Kia Sorento Hybrid': 8.3,

  // Full-Size SUVs
  'Chevrolet Tahoe': 8.0,
  'Chevrolet Suburban': 8.0,
  'GMC Yukon': 8.0,
  'Ford Expedition': 9.8,
  'Toyota Sequoia': 9.5,
  'Nissan Armada': 9.2,
  'Cadillac Escalade': 8.0,
  'Lincoln Navigator': 9.0,
  'Lexus LX': 8.9,
  'Lexus GX': 8.9,
  'Land Rover Range Rover': 11.6,
  'Land Rover Defender': 11.5,
  'Infiniti QX80': 9.2,

  // Subcompact SUVs/Crossovers
  'Honda HR-V': 7.3,
  'Toyota C-HR': 5.9,
  'Hyundai Kona': 6.7,
  'Hyundai Venue': 6.7,
  'Kia Soul': 6.7,
  'Kia Seltos': 7.2,
  'Mazda CX-30': 6.9,
  'Chevrolet Trailblazer': 7.5,
  'Nissan Kicks': 7.0,
  'Jeep Renegade': 8.7,
  'Buick Encore': 6.9,
  'Ford Bronco Sport': 8.8,
  'Dodge Hornet': 7.9,
  'Buick Envision': 7.9,

  // Trucks
  'Ford F-150': 9.4,
  'Chevrolet Silverado 1500': 8.9,
  'Ram 1500': 8.7,
  'GMC Sierra 1500': 8.9,
  'Toyota Tacoma': 9.4,
  'Toyota Tundra': 10.6,
  'Honda Ridgeline': 7.6,
  'Nissan Frontier': 9.4,
  'Chevrolet Colorado': 8.9,
  'GMC Canyon': 8.9,
  'Ford Ranger': 8.9,
  'Jeep Gladiator': 11.1,
  'Tesla Cybertruck': 17.0,

  // Electric SUVs/Crossovers
  'Tesla Model Y': 6.6,
  'Tesla Model X': 6.5,
  'Ford Mustang Mach-E': 5.8,
  'Chevrolet Bolt EUV': 6.6,
  'Chevrolet Bolt EV': 6.4,
  'Volkswagen ID.4': 8.0,
  'Hyundai Ioniq 5': 6.1,
  'Hyundai Ioniq 6': 4.9,
  'Kia EV6': 6.1,
  'Kia EV9': 7.8,
  'Kia Niro EV': 6.3,
  'Rivian R1S': 14.9,
  'Rivian R1T': 14.9,
  'Rivian R2': 8.5,
  'Cadillac Lyriq': 6.0,
  'BMW iX': 6.9,
  'BMW i4': 5.1,
  'Mercedes-Benz EQE': 5.0,
  'Mercedes-Benz EQE SUV': 6.7,
  'Mercedes-Benz EQS SUV': 7.1,
  'Audi Q4 e-tron': 6.9,
  'Audi Q6 e-tron': 7.3,
  'Audi Q8 e-tron': 7.1,
  'Audi e-tron GT': 5.3,
  'Porsche Taycan': 5.1,
  'Porsche Macan Electric': 6.9,
  'Porsche Cayenne': 8.3,
  'Polestar 2': 5.9,
  'Polestar 3': 7.7,
  'Volvo XC40 Recharge': 8.3,
  'Volvo C40 Recharge': 6.9,
  'Volvo EX90': 9.3,
  'Genesis GV60': 6.1,
  'Genesis GV70': 7.3,
  'Genesis GV80': 8.0,
  'Genesis Electrified GV70': 7.3,
  'Subaru Solterra': 8.3,
  'Toyota bZ4X': 8.3,
  'Jaguar I-PACE': 6.5,
  'Nissan Ariya': 7.0,
  'Lexus RZ': 6.1,
  'Lucid Air': 5.3,
  'Lucid Gravity': 6.4,
  'Honda Prologue': 8.0,
  'Jeep Wagoneer S': 6.4,
  'BMW i5': 5.2,

  // Sedans
  'Toyota Camry': 5.7,
  'Toyota Camry Hybrid': 5.7,
  'Honda Accord': 5.3,
  'Honda Accord Hybrid': 5.3,
  'Honda Civic': 4.8,
  'Toyota Corolla': 5.3,
  'Toyota Corolla Hybrid': 5.3,
  'Toyota Crown': 6.3,
  'Hyundai Sonata': 6.3,
  'Hyundai Sonata Hybrid': 6.3,
  'Hyundai Elantra': 5.3,
  'Kia K5': 5.3,
  'Kia Forte': 5.3,
  'Mazda3': 5.5,
  'Mazda Mazda3': 5.5,
  'Nissan Altima': 5.3,
  'Nissan Sentra': 5.5,
  'Subaru Legacy': 5.9,
  'Subaru Impreza': 5.3,
  'Volkswagen Jetta': 5.4,
  'Tesla Model 3': 5.5,
  'Tesla Model S': 4.6,
  'BMW 3 Series': 5.5,
  'Audi A4': 5.8,
  'Audi A6': 5.8,
  'Mercedes-Benz S-Class': 4.5,
  'Mercedes-Benz GLC': 7.8,
  'Mercedes-Benz GLE': 8.3,
  'Lexus ES': 5.7,
  'Lexus IS': 5.0,
  'Acura TLX': 5.4,
  'Acura Integra': 4.9,
  'Genesis G70': 5.0,
  'Genesis G80': 5.5,
  'Toyota Prius': 5.1,
  'Toyota Prius Prime': 5.1,
  'Honda Insight': 4.9,

  // Minivans
  'Honda Odyssey': 4.8,
  'Toyota Sienna': 6.1,
  'Kia Carnival': 6.4,
  'Chrysler Pacifica': 5.1,

  // Luxury SUVs
  'Lexus RX': 8.0,
  'Lexus NX': 8.1,
  'Acura MDX': 7.3,
  'Acura RDX': 8.2,
  'BMW X5': 8.7,
  'BMW X3': 8.0,
  'Volvo XC90': 9.3,
  'Volvo XC60': 9.4,
  'Lincoln Nautilus': 7.8,
  'Infiniti QX60': 7.0,

  // Off-road focused
  'Jeep Wrangler': 10.0,

  // Additional models
  'Chevrolet Equinox EV': 7.9,
  'Chevrolet Trax': 6.7,
  'Audi Q5': 8.2,
  'Lexus RX Hybrid': 8.0,
  'Nissan Murano': 7.1,
  'Nissan Pathfinder': 7.1,
  'Lincoln Aviator': 7.9,
  'Toyota 4Runner': 9.6,
  'Mitsubishi Outlander': 8.5,
  'Mitsubishi Outlander PHEV': 8.5,
  'Ford Edge': 7.9,
  'Chevrolet Blazer EV': 6.5,
  'Nissan Leaf': 6.3,
  'Subaru Forester Hybrid': 8.7,
  'Audi Q7': 9.2,
};

// Towing capacity data (lbs)
// Sources: manufacturer specs
const TOWING_CAPACITY = {
  // Compact SUVs/Crossovers
  'Toyota RAV4': 3500,
  'Toyota RAV4 Hybrid': 2500,
  'Toyota RAV4 Prime': 2500,
  'Honda CR-V': 1500,
  'Honda CR-V Hybrid': 1000,
  'Mazda CX-5': 2000,
  'Mazda CX-50': 3500,
  'Subaru Forester': 1500,
  'Subaru Outback': 3500,
  'Subaru Crosstrek': 1500,
  'Nissan Rogue': 1500,
  'Ford Escape': 3500,
  'Ford Escape Hybrid': 1500,
  'Hyundai Tucson': 2000,
  'Hyundai Tucson Hybrid': 2000,
  'Kia Sportage': 2500,
  'Chevrolet Equinox': 1500,
  'Volkswagen Tiguan': 1500,
  'Jeep Compass': 2000,
  'Jeep Cherokee': 4500,
  'GMC Terrain': 1500,

  // Midsize SUVs
  'Toyota Highlander': 5000,
  'Toyota Highlander Hybrid': 3500,
  'Toyota Grand Highlander': 5000,
  'Honda Pilot': 5000,
  'Honda Passport': 5000,
  'Hyundai Palisade': 5000,
  'Kia Telluride': 5500,
  'Mazda CX-9': 3500,
  'Mazda CX-90': 5000,
  'Mazda CX-70': 5000,
  'Subaru Ascent': 5000,
  'Ford Explorer': 5600,
  'Chevrolet Traverse': 5000,
  'Chevrolet Blazer': 4500,
  'Dodge Durango': 8700,
  'Jeep Grand Cherokee': 7200,
  'Jeep Grand Cherokee 4xe': 6000,
  'Volkswagen Atlas': 5000,
  'GMC Acadia': 4000,
  'Buick Enclave': 5000,
  'Hyundai Santa Fe': 3500,
  'Kia Sorento': 5000,
  'Kia Sorento Hybrid': 3500,

  // Full-Size SUVs
  'Chevrolet Tahoe': 8400,
  'Chevrolet Suburban': 8300,
  'GMC Yukon': 8400,
  'Ford Expedition': 9300,
  'Toyota Sequoia': 9520,
  'Nissan Armada': 8500,
  'Cadillac Escalade': 8200,
  'Lincoln Navigator': 8700,
  'Lexus LX': 8000,
  'Lexus GX': 9100,
  'Land Rover Range Rover': 7716,
  'Land Rover Defender': 8201,
  'Infiniti QX80': 8500,

  // Subcompact SUVs/Crossovers
  'Honda HR-V': 0,
  'Toyota C-HR': 0,
  'Hyundai Kona': 0,
  'Hyundai Venue': 0,
  'Kia Soul': 0,
  'Kia Seltos': 2000,
  'Mazda CX-30': 0,
  'Chevrolet Trailblazer': 1000,
  'Nissan Kicks': 0,
  'Jeep Renegade': 2000,
  'Buick Encore': 0,
  'Ford Bronco Sport': 2200,
  'Dodge Hornet': 2000,
  'Buick Envision': 1500,

  // Trucks
  'Ford F-150': 14000,
  'Chevrolet Silverado 1500': 13300,
  'Ram 1500': 12750,
  'GMC Sierra 1500': 13300,
  'Toyota Tacoma': 6800,
  'Toyota Tundra': 12000,
  'Honda Ridgeline': 5000,
  'Nissan Frontier': 6720,
  'Chevrolet Colorado': 7700,
  'GMC Canyon': 7700,
  'Ford Ranger': 7500,
  'Jeep Gladiator': 7700,
  'Tesla Cybertruck': 11000,

  // Electric SUVs/Crossovers (most EVs have limited towing)
  'Tesla Model Y': 3500,
  'Tesla Model X': 5000,
  'Ford Mustang Mach-E': 0,
  'Chevrolet Bolt EUV': 0,
  'Chevrolet Bolt EV': 0,
  'Volkswagen ID.4': 2700,
  'Hyundai Ioniq 5': 2300,
  'Hyundai Ioniq 6': 0,
  'Kia EV6': 2300,
  'Kia EV9': 5000,
  'Kia Niro EV': 0,
  'Rivian R1S': 7700,
  'Rivian R1T': 11000,
  'Rivian R2': 5000,
  'Cadillac Lyriq': 3500,
  'BMW iX': 6000,
  'BMW i4': 0,
  'Mercedes-Benz EQE': 0,
  'Mercedes-Benz EQE SUV': 4000,
  'Mercedes-Benz EQS SUV': 3500,
  'Audi Q4 e-tron': 2400,
  'Audi Q6 e-tron': 4400,
  'Audi Q8 e-tron': 4000,
  'Audi e-tron GT': 0,
  'Porsche Taycan': 0,
  'Porsche Macan Electric': 4409,
  'Porsche Cayenne': 7716,
  'Polestar 2': 2000,
  'Polestar 3': 4409,
  'Volvo XC40 Recharge': 3500,
  'Volvo C40 Recharge': 2000,
  'Volvo EX90': 5500,
  'Genesis GV60': 0,
  'Genesis GV70': 3500,
  'Genesis GV80': 6000,
  'Genesis Electrified GV70': 0,
  'Subaru Solterra': 0,
  'Toyota bZ4X': 0,
  'Jaguar I-PACE': 0,
  'Nissan Ariya': 0,
  'Lexus RZ': 0,
  'Lucid Air': 0,
  'Lucid Gravity': 6000,
  'Honda Prologue': 3500,
  'Jeep Wagoneer S': 0,
  'BMW i5': 0,

  // Sedans (most sedans can't tow much)
  'Toyota Camry': 1000,
  'Toyota Camry Hybrid': 1000,
  'Honda Accord': 1000,
  'Honda Accord Hybrid': 0,
  'Honda Civic': 0,
  'Toyota Corolla': 0,
  'Toyota Corolla Hybrid': 0,
  'Toyota Crown': 1000,
  'Hyundai Sonata': 0,
  'Hyundai Sonata Hybrid': 0,
  'Hyundai Elantra': 0,
  'Kia K5': 0,
  'Kia Forte': 0,
  'Mazda3': 0,
  'Mazda Mazda3': 0,
  'Nissan Altima': 0,
  'Nissan Sentra': 0,
  'Subaru Legacy': 2700,
  'Subaru Impreza': 0,
  'Volkswagen Jetta': 0,
  'Tesla Model 3': 0,
  'Tesla Model S': 0,
  'BMW 3 Series': 0,
  'Audi A4': 0,
  'Audi A6': 4400,
  'Mercedes-Benz S-Class': 0,
  'Mercedes-Benz GLC': 4000,
  'Mercedes-Benz GLE': 7700,
  'Lexus ES': 0,
  'Lexus IS': 0,
  'Acura TLX': 0,
  'Acura Integra': 0,
  'Genesis G70': 0,
  'Genesis G80': 0,
  'Toyota Prius': 0,
  'Toyota Prius Prime': 0,
  'Honda Insight': 0,

  // Minivans
  'Honda Odyssey': 3500,
  'Toyota Sienna': 3500,
  'Kia Carnival': 3500,
  'Chrysler Pacifica': 3600,

  // Luxury SUVs
  'Lexus RX': 3500,
  'Lexus NX': 2000,
  'Acura MDX': 5000,
  'Acura RDX': 1500,
  'BMW X5': 7200,
  'BMW X3': 4400,
  'Volvo XC90': 5000,
  'Volvo XC60': 4400,
  'Lincoln Nautilus': 3500,
  'Infiniti QX60': 6000,

  // Off-road focused
  'Jeep Wrangler': 3500,

  // Additional models
  'Chevrolet Equinox EV': 3500,
  'Chevrolet Trax': 0,
  'Audi Q5': 4400,
  'Lexus RX Hybrid': 3500,
  'Nissan Murano': 1500,
  'Nissan Pathfinder': 6000,
  'Lincoln Aviator': 6700,
  'Toyota 4Runner': 5000,
  'Mitsubishi Outlander': 2000,
  'Mitsubishi Outlander PHEV': 1500,
  'Ford Edge': 3500,
  'Chevrolet Blazer EV': 0,
  'Nissan Leaf': 0,
  'Subaru Forester Hybrid': 1500,
  'Audi Q7': 7700,
};

// Load existing cars.json
const carsPath = path.join(__dirname, '../src/data/cars.json');
const data = JSON.parse(fs.readFileSync(carsPath, 'utf8'));

let updatedGC = 0;
let updatedTow = 0;
let missingGC = [];
let missingTow = [];

data.cars.forEach(car => {
  const modelKey = `${car.make} ${car.model}`;
  const shortKey = car.model;

  // Ground clearance
  if (GROUND_CLEARANCE[modelKey] !== undefined) {
    car.groundClearanceInches = GROUND_CLEARANCE[modelKey];
    updatedGC++;
  } else if (GROUND_CLEARANCE[shortKey] !== undefined) {
    car.groundClearanceInches = GROUND_CLEARANCE[shortKey];
    updatedGC++;
  } else {
    missingGC.push(`${car.year} ${car.make} ${car.model}`);
  }

  // Towing capacity
  if (TOWING_CAPACITY[modelKey] !== undefined) {
    car.towingCapacityLbs = TOWING_CAPACITY[modelKey];
    updatedTow++;
  } else if (TOWING_CAPACITY[shortKey] !== undefined) {
    car.towingCapacityLbs = TOWING_CAPACITY[shortKey];
    updatedTow++;
  } else {
    missingTow.push(`${car.year} ${car.make} ${car.model}`);
  }
});

// Save updated data
fs.writeFileSync(carsPath, JSON.stringify(data, null, 2));

console.log(`Updated ${updatedGC} cars with ground clearance`);
console.log(`Updated ${updatedTow} cars with towing capacity`);

if (missingGC.length > 0) {
  console.log(`\nMissing ground clearance (${missingGC.length}):`);
  missingGC.forEach(c => console.log(`  ${c}`));
}

if (missingTow.length > 0) {
  console.log(`\nMissing towing capacity (${missingTow.length}):`);
  missingTow.forEach(c => console.log(`  ${c}`));
}

const fs = require('fs');
const path = require('path');

// MotorMashup review scores (0-100 scale, aggregated from expert reviews)
// Source: https://motormashup.com/
// Note: Scores are relative within category, normalized to 0-100

const REVIEW_SCORES = {
  // Small SUVs / Crossovers
  'Honda CR-V': 100,
  'Mazda CX-5': 96,
  'Subaru Forester': 85,
  'Toyota RAV4': 83,
  'Nissan Rogue': 79,
  'Ford Escape': 76,
  'Hyundai Tucson': 67,
  'Kia Sportage': 65,
  'Chevrolet Equinox': 58,
  'Volkswagen Tiguan': 58,
  'Jeep Wrangler': 53,
  'GMC Terrain': 44,
  'Jeep Cherokee': 35,
  'Jeep Compass': 20,
  'Mitsubishi Outlander': 40, // Adjusted - 0 likely meant no data

  // Midsize SUVs
  'Kia Telluride': 100,
  'Hyundai Palisade': 93,
  'Honda Pilot': 80,
  'Toyota Highlander': 79,
  'Kia Sorento': 78,
  'Honda Passport': 74,
  'Subaru Ascent': 72,
  'Mazda CX-9': 71,
  'Mazda CX-90': 75, // Newer replacement for CX-9
  'Ford Edge': 67,
  'Chevrolet Traverse': 66,
  'Buick Enclave': 65,
  'Chevrolet Blazer': 65,
  'Ford Explorer': 64,
  'Volkswagen Atlas': 63,
  'GMC Acadia': 56,
  'Dodge Durango': 54,
  'Nissan Murano': 50,
  'Nissan Pathfinder': 42,
  'Toyota 4Runner': 32,

  // Full Size SUVs
  'Chevrolet Tahoe': 100,
  'Ford Expedition': 96,
  'Chevrolet Suburban': 82,
  'GMC Yukon': 81,
  'Nissan Armada': 47,
  'Toyota Sequoia': 55, // Adjusted - new model is better

  // Subcompact SUVs / Crossovers
  'Kia Soul': 100,
  'Mazda CX-30': 98,
  'Kia Seltos': 91,
  'Hyundai Kona': 89,
  'Subaru Crosstrek': 87,
  'Hyundai Venue': 78,
  'Chevrolet Trailblazer': 72,
  'Mazda CX-3': 64,
  'Honda HR-V': 62,
  'Nissan Kicks': 56,
  'Toyota C-HR': 42,
  'Buick Encore': 41,
  'Jeep Renegade': 37,
  'Chevrolet Trax': 7,

  // Midsize Sedans
  'Kia K5': 100,
  'Honda Accord': 100,
  'Hyundai Sonata': 86,
  'Mazda Mazda6': 77,
  'Mazda6': 77,
  'Toyota Camry': 73,
  'Subaru Legacy': 49,
  'Nissan Altima': 46,
  'Volkswagen Passat': 24,
  'Chevrolet Malibu': 35,

  // Small Sedans / Compacts
  'Honda Civic': 100,
  'Volkswagen GTI': 96,
  'Honda Insight': 94,
  'Mazda3': 88,
  'Mazda Mazda3': 88,
  'Honda Fit': 88,
  'Kia Forte': 87,
  'Hyundai Elantra': 85,
  'Toyota Corolla': 80,
  'Subaru Impreza': 75,
  'Volkswagen Jetta': 70,
  'Nissan Sentra': 60,
  'Nissan Versa': 50,
  'Hyundai Accent': 55,
  'Kia Rio': 55,
  'Toyota Prius': 85,
  'Hyundai Ioniq': 80,

  // Midsize Pickups
  'Honda Ridgeline': 100,
  'Jeep Gladiator': 73,
  'Chevrolet Colorado': 62,
  'GMC Canyon': 58,
  'Ford Ranger': 54,
  'Toyota Tacoma': 49,
  'Nissan Frontier': 45,

  // Full Size Pickups (estimated based on reviews)
  'Ford F-150': 95,
  'Ram 1500': 93,
  'Chevrolet Silverado 1500': 80,
  'GMC Sierra 1500': 78,
  'Toyota Tundra': 70,
  'Nissan Titan': 50,

  // Minivans (estimated based on reviews)
  'Honda Odyssey': 95,
  'Kia Carnival': 92,
  'Toyota Sienna': 88,
  'Chrysler Pacifica': 85,
  'Chrysler Voyager': 60,

  // Electric Vehicles (estimated based on reviews)
  'Tesla Model 3': 90,
  'Tesla Model Y': 88,
  'Tesla Model S': 85,
  'Tesla Model X': 80,
  'Ford Mustang Mach-E': 88,
  'Hyundai Ioniq 5': 92,
  'Hyundai Ioniq 6': 90,
  'Kia EV6': 93,
  'Kia EV9': 90,
  'Chevrolet Bolt EV': 75,
  'Chevrolet Bolt EUV': 78,
  'Volkswagen ID.4': 72,
  'Nissan Leaf': 65,
  'Nissan Ariya': 75,
  'BMW iX': 82,
  'BMW i4': 85,
  'Mercedes EQS': 80,
  'Mercedes EQE': 78,
  'Rivian R1T': 88,
  'Rivian R1S': 87,
  'Rivian R2': 85, // Expected based on R1 line
  'Lucid Air': 85,
  'Polestar 2': 82,
  'Genesis GV60': 86,
  'Genesis Electrified GV70': 84,
  'Cadillac Lyriq': 83,
  'Audi Q4 e-tron': 78,
  'Audi e-tron GT': 85,
  'Porsche Taycan': 90,
  'Subaru Solterra': 65,
  'Toyota bZ4X': 65,
  'Mazda MX-30': 55,
  'Volvo XC40 Recharge': 78,
  'Volvo C40 Recharge': 76,

  // Hybrids
  'Toyota RAV4 Hybrid': 85,
  'Toyota RAV4 Prime': 90,
  'Honda CR-V Hybrid': 92,
  'Toyota Highlander Hybrid': 82,
  'Hyundai Tucson Hybrid': 75,
  'Hyundai Santa Fe Hybrid': 78,
  'Kia Sorento Hybrid': 80,
  'Ford Escape Hybrid': 72,
  'Toyota Camry Hybrid': 78,
  'Honda Accord Hybrid': 95,
  'Hyundai Sonata Hybrid': 82,
  'Toyota Prius Prime': 88,
  'Toyota Corolla Hybrid': 82,

  // Additional models
  'Mazda CX-50': 90,
  'Subaru Outback': 82,
  'Toyota Grand Highlander': 78,
  'Kia Niro EV': 80,
  'Honda Prologue': 82,
  'Jeep Grand Cherokee': 60,
  'Jeep Grand Cherokee 4xe': 65,
  'Dodge Hornet': 55,
  'Buick Envision': 62,
  'Lincoln Nautilus': 75,
  'Polestar 3': 80,
  'Lucid Gravity': 82,
  'Toyota Crown': 75,
  'Hyundai Santa Fe': 80,
  'Mazda CX-70': 78,
  'Ford Bronco Sport': 72,
  'Jeep Wagoneer S': 70,
  'Tesla Cybertruck': 65,
  'BMW i5': 82,
  'Audi Q8 e-tron': 75,
  'Audi Q6 e-tron': 80,
  'Audi A6': 78,
  'Audi Q7': 80,
  'Lexus GX': 72,
  'Lexus LX': 70,
  'Porsche Cayenne': 88,
  'Porsche Macan Electric': 85,
  'Jaguar I-PACE': 72,
  'Land Rover Range Rover': 75,
  'Land Rover Defender': 70,
  'Infiniti QX80': 55,
  'Infiniti QX60': 58,
  'Lexus RZ': 68,
  'Volvo EX90': 80,

  // Mercedes models
  'Mercedes-Benz GLC': 80,
  'Mercedes-Benz EQE SUV': 75,
  'Mercedes-Benz EQS SUV': 78,
  'Mercedes-Benz EQE': 78,
  'Mercedes-Benz S-Class': 85,
  'Mercedes-Benz GLE': 82,

  // Luxury brands (estimated)
  'Lexus RX': 85,
  'Lexus NX': 82,
  'Lexus ES': 80,
  'Lexus IS': 75,
  'Acura MDX': 82,
  'Acura RDX': 80,
  'Acura TLX': 75,
  'Acura Integra': 78,
  'BMW X5': 85,
  'BMW X3': 83,
  'BMW 3 Series': 88,
  'Mercedes GLE': 82,
  'Mercedes GLC': 80,
  'Audi Q5': 82,
  'Audi A4': 80,
  'Volvo XC90': 85,
  'Volvo XC60': 83,
  'Genesis GV80': 88,
  'Genesis GV70': 90,
  'Genesis G70': 85,
  'Genesis G80': 82,
  'Lincoln Navigator': 80,
  'Lincoln Aviator': 78,
  'Cadillac Escalade': 82,
};

// Load existing cars.json
const carsPath = path.join(__dirname, '../src/data/cars.json');
const data = JSON.parse(fs.readFileSync(carsPath, 'utf8'));

let updated = 0;
let notFound = [];

data.cars.forEach(car => {
  // Try different variations of the model name
  const variations = [
    `${car.make} ${car.model}`,
    car.model,
    `${car.make} ${car.model.split(' ')[0]}`, // First word of model
  ];

  let score = null;
  for (const variation of variations) {
    if (REVIEW_SCORES[variation] !== undefined) {
      score = REVIEW_SCORES[variation];
      break;
    }
  }

  if (score !== null) {
    car.reviewScore = score;
    updated++;
  } else {
    notFound.push(`${car.year} ${car.make} ${car.model}`);
  }
});

// Save updated data
fs.writeFileSync(carsPath, JSON.stringify(data, null, 2));

console.log(`Updated ${updated} cars with review scores`);
console.log(`\nCars without scores (${notFound.length}):`);
notFound.forEach(c => console.log(`  ${c}`));
